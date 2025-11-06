import express from "express";
import cors from "cors";
import { config } from "dotenv";
import { createGraph } from "./graph.js";
import { fetchBranchFiles } from "./github.js";
import db from "./db.js";

config();

const app = express();
app.use(cors());
app.use(express.json());

const graph = createGraph();

// Store for active review sessions
const activeReviews = new Map();

// Agent progress tracking
interface AgentProgress {
  plan: string[];
  currentStep: number;
  totalSteps: number;
  checkpoints: Checkpoint[];
}

interface Checkpoint {
  agent: string;
  status: 'pending' | 'in-progress' | 'completed' | 'error';
  startTime?: string;
  endTime?: string;
  description: string;
  details?: string;
}

const createInitialProgress = (): AgentProgress => ({
  plan: [
    "📋 Initialize review session",
    "🔍 Check commit history for changes", 
    "📁 Analyze repository structure",
    "🔬 Deep code analysis with AI",
    "📊 Generate comprehensive report",
    "💾 Save results to database"
  ],
  currentStep: 0,
  totalSteps: 6,
  checkpoints: [
    {
      agent: "planner",
      status: "completed",
      description: "Review plan created",
      details: "Generated analysis roadmap with 6 key stages"
    },
    {
      agent: "history_checker", 
      status: "pending",
      description: "Checking for repository changes",
      details: "Comparing with previous review commits"
    },
    {
      agent: "review_agent",
      status: "pending", 
      description: "AI code analysis in progress",
      details: "Deep analysis of code quality, bugs, and architecture"
    },
    {
      agent: "publisher",
      status: "pending",
      description: "Finalizing and saving results", 
      details: "Storing review results and generating final report"
    }
  ]
});

const updateProgress = (sessionId: string, agent: string, status: Checkpoint['status'], details?: string) => {
  const session = activeReviews.get(sessionId);
  if (!session || !session.progress) return;

  const checkpoint = session.progress.checkpoints.find((cp: Checkpoint) => cp.agent === agent);
  if (checkpoint) {
    checkpoint.status = status;
    if (status === 'in-progress') {
      checkpoint.startTime = new Date().toISOString();
      session.progress.currentStep++;
    }
    if (status === 'completed') {
      checkpoint.endTime = new Date().toISOString();
    }
    if (details) {
      checkpoint.details = details;
    }

    // Send progress update
    if (session.res) {
      session.res.write(`data: ${JSON.stringify({ 
        type: 'progress', 
        progress: session.progress,
        checkpoint: checkpoint
      })}\n\n`);
    }
  }
};

app.get("/review", (req, res) => {
  console.log("[INFO] EventSource connection established");
  // Handle EventSource connection
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.flushHeaders();

  const sessionId = Date.now().toString();
  const progress = createInitialProgress();
  
  activeReviews.set(sessionId, { res, progress });
  console.log(`[INFO] Created session: ${sessionId}`);

  // Send session ID and initial progress
  res.write(`data: ${JSON.stringify({ sessionId, type: 'init', progress })}\n\n`);

  req.on('close', () => {
    console.log(`[INFO] Session closed: ${sessionId}`);
    activeReviews.delete(sessionId);
  });
});

app.post("/review", async (req, res) => {
  const { user_id, repo, branch = "main", sessionId } = req.body;
  console.log(`[INFO] Review requested for ${repo}:${branch} by ${user_id} with session ${sessionId}`);
  
  const [owner, repoName] = repo.split("/");

  // Get the EventSource connection
  const session = activeReviews.get(sessionId);
  if (!session || !session.res) {
    console.log(`[ERROR] No active EventSource connection found for session: ${sessionId}`);
    return res.status(400).json({ error: "No active EventSource connection found" });
  }

  const eventSourceRes = session.res;
  console.log(`[INFO] Starting review process for ${repo}:${branch}`);

  let commitHash = "";
  const files: any[] = [];

  try {
    // Start history checker
    updateProgress(sessionId, "history_checker", "in-progress", "Fetching repository information...");
    console.log(`[INFO] Fetching files from ${repo}:${branch}`);
    
    for await (const msg of fetchBranchFiles(repo, branch)) {
      if (typeof msg === "string") {
        console.log(`[LOG] ${msg}`);
        eventSourceRes.write(`data: ${JSON.stringify({ type: 'log', log: msg })}\n\n`);
      } else {
        files.push(...msg);
        console.log(`[INFO] Fetched ${msg.length} files`);
        const branchRes = await fetch(`https://api.github.com/repos/${repo}/branches/${branch}`, {
          headers: {
            Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
            Accept: "application/vnd.github.v3+json",
          },
        });
        const data = await branchRes.json();
        commitHash = data.commit.sha;
        console.log(`[INFO] Got commit hash: ${commitHash}`);
      }
    }
    
    updateProgress(sessionId, "history_checker", "completed", `Found ${files.length} files to review`);
  } catch (e: any) {
    console.log(`[ERROR] Failed to fetch files: ${e.message}`);
    updateProgress(sessionId, "history_checker", "error", e.message);
    eventSourceRes.write(`data: ${JSON.stringify({ type: 'error', error: e.message })}\n\n`);
    eventSourceRes.end();
    activeReviews.delete(sessionId);
    return res.json({ success: false, error: e.message });
  }

  const inputs = {
    userId: user_id,
    owner,
    repo: repoName,
    branch,
    files,
    commitHash,
    rules: [],
    review: "",
    logs: [],
  };

  const config = { configurable: { thread_id: `review-${Date.now()}` } };

  try {
    // Start review agent
    updateProgress(sessionId, "review_agent", "in-progress", "AI analyzing code quality and architecture...");
    console.log(`[INFO] Starting LangGraph stream for review`);
    
    const stream = await graph.stream(inputs as any, config);

    for await (const chunk of stream) {
      // Get the latest state from any of the nodes
      const state = chunk.history_checker || chunk.review_agent || chunk.publisher || {};
      if ((state as any).logs?.length) {
        const log = (state as any).logs[(state as any).logs.length - 1];
        console.log(`[GRAPH LOG] ${log}`);
        eventSourceRes.write(`data: ${JSON.stringify({ type: 'log', log })}\n\n`);
      }
      if ((state as any).review) {
        console.log(`[INFO] Review completed`);
        updateProgress(sessionId, "review_agent", "completed", "Analysis complete - generating final report");
        updateProgress(sessionId, "publisher", "in-progress", "Saving results...");
        eventSourceRes.write(`data: ${JSON.stringify({ type: 'review', review: (state as any).review })}\n\n`);
      }
    }

    updateProgress(sessionId, "publisher", "completed", "Review saved successfully");
    console.log(`[INFO] Review process completed successfully`);
    eventSourceRes.write(`data: ${JSON.stringify({ type: 'done', done: true })}\n\n`);
    res.json({ success: true });
  } catch (e: any) {
    console.log(`[ERROR] Review failed: ${e.message}`);
    updateProgress(sessionId, "review_agent", "error", e.message);
    eventSourceRes.write(`data: ${JSON.stringify({ type: 'error', error: e.message })}\n\n`);
    res.json({ success: false, error: e.message });
  } finally {
    console.log(`[INFO] Cleaning up session: ${sessionId}`);
    eventSourceRes.end();
    activeReviews.delete(sessionId);
  }
});

app.get("/rules/:userId/:repoName", (req, res) => {
  const { userId, repoName } = req.params;
  console.log(`[INFO] Loading rules for ${userId}/${repoName}`);
  const row = db
    .prepare("SELECT rules FROM rules WHERE user_id = ? AND repo_name = ?")
    .get(userId, repoName) as { rules?: string } | undefined;
  const rules = row?.rules ? JSON.parse(row.rules) : [];
  console.log(`[INFO] Found ${rules.length} rules for ${userId}/${repoName}`);
  res.json({ rules });
});

app.post("/rules", (req, res) => {
  const { user_id, repo_name, rules } = req.body;
  console.log(`[INFO] Saving ${rules.length} rules for ${user_id}/${repo_name}`);
  db.prepare("INSERT OR REPLACE INTO rules (user_id, repo_name, rules) VALUES (?, ?, ?)")
    .run(user_id, repo_name, JSON.stringify(rules));
  console.log(`[INFO] Rules saved successfully for ${user_id}/${repo_name}`);
  res.json({ status: "saved" });
});

app.get("/history/:userId/:repoName", (req, res) => {
  const { userId, repoName } = req.params;
  const { limit = 10 } = req.query;
  
  console.log(`[INFO] Fetching review history for ${userId}/${repoName}`);
  
  try {
    const rows = db
      .prepare(`
        SELECT commit_hash, review_result, timestamp 
        FROM history 
        WHERE user_id = ? AND repo_full LIKE ? 
        ORDER BY timestamp DESC 
        LIMIT ?
      `)
      .all(userId, `%${repoName}%`, Number(limit));
    
    const history = rows.map((row: any) => ({
      commitHash: row.commit_hash,
      review: row.review_result,
      timestamp: row.timestamp,
      date: new Date(row.timestamp).toLocaleString()
    }));
    
    console.log(`[INFO] Found ${history.length} review history entries for ${userId}/${repoName}`);
    res.json({ history });
  } catch (error) {
    console.error(`[ERROR] Failed to fetch history: ${error}`);
    res.status(500).json({ error: "Failed to fetch review history" });
  }
});

app.delete("/history/:userId/:repoName/:commitHash", (req, res) => {
  const { userId, repoName, commitHash } = req.params;
  
  console.log(`[INFO] Deleting review history for ${userId}/${repoName}@${commitHash}`);
  
  try {
    const result = db
      .prepare("DELETE FROM history WHERE user_id = ? AND repo_full LIKE ? AND commit_hash = ?")
      .run(userId, `%${repoName}%`, commitHash);
    
    if (result.changes > 0) {
      console.log(`[INFO] Successfully deleted review history entry`);
      res.json({ success: true, message: "Review history deleted" });
    } else {
      res.status(404).json({ error: "Review history not found" });
    }
  } catch (error) {
    console.error(`[ERROR] Failed to delete history: ${error}`);
    res.status(500).json({ error: "Failed to delete review history" });
  }
});

const PORT = 8000;
app.listen(PORT, () => {
  console.log(`[INFO] Backend running at http://localhost:${PORT}`);
  console.log(`[INFO] Available endpoints:`);
  console.log(`  GET  /review           - EventSource connection for real-time updates`);
  console.log(`  POST /review           - Start code review process`);
  console.log(`  GET  /rules/:userId/:repoName - Load rules for user/repo`);
  console.log(`  POST /rules            - Save rules for user/repo`);
  console.log(`  GET  /history/:userId/:repoName - Get review history`);
  console.log(`  DELETE /history/:userId/:repoName/:commitHash - Delete specific review`);
});
