import { StateGraph, END, START } from "@langchain/langgraph";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HumanMessage } from "@langchain/core/messages";
import { config } from "dotenv";
import db from "./db.js";

config();

const llm = new ChatGoogleGenerativeAI({
  model: "gemini-2.0-flash",
  temperature: 0.3,
  apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY,
});

interface AgentState {
  userId: string;
  owner: string;
  repo: string;
  branch: string;
  files: any[];
  commitHash: string;
  rules: string[];
  review: string;
  logs: string[];
}

interface DBRow {
  rules?: string;
  commit_hash?: string;
  review_result?: string;
}

const getRules = (userId: string, repoName: string): string[] => {
  const row = db
    .prepare("SELECT rules FROM rules WHERE user_id = ? AND repo_name = ?")
    .get(userId, repoName) as DBRow | undefined;
  return row?.rules ? JSON.parse(row.rules) : [];
};

const getLastReview = (userId: string, repoFull: string) => {
  const row = db
    .prepare("SELECT commit_hash, review_result FROM history WHERE user_id = ? AND repo_full = ?")
    .get(userId, repoFull) as DBRow | undefined;
  return row || null;
};

const saveReview = (userId: string, repoFull: string, commitHash: string, review: string) => {
  db.prepare(
    "INSERT OR REPLACE INTO history (user_id, repo_full, commit_hash, review_result, timestamp) VALUES (?, ?, ?, ?, ?)"
  ).run(userId, repoFull, commitHash, review, new Date().toISOString());
};

const historyChecker = (state: AgentState): Partial<AgentState> => {
  const repoFull = `${state.owner}/${state.repo}@${state.branch}`;
  const last = getLastReview(state.userId, repoFull);
  if (last && last.commit_hash === state.commitHash) {
    return {
      review: "SKIPPED: No changes since last review.",
      logs: [...state.logs, "History: No changes – skipping."],
    };
  }
  return state;
};

const reviewAgent = async (state: AgentState): Promise<Partial<AgentState>> => {
  const rules = getRules(state.userId, state.repo);
  
  // First, let's get an overview of the codebase
  const fileList = state.files.map(f => `- ${f.filename} (${f.content.length} chars)`).join('\n');
  
  let prompt = `You are an expert code reviewer analyzing the repository ${state.owner}/${state.repo} (branch: ${state.branch}).

CUSTOM RULES TO FOLLOW:
${rules.length > 0 ? rules.map(rule => `- ${rule}`).join('\n') : '- No custom rules specified'}

Please provide a comprehensive code review in the following JSON structure:

{
  "summary": {
    "totalFiles": ${state.files.length},
    "overallQuality": "excellent|good|fair|poor",
    "mainLanguages": ["language1", "language2"],
    "architecturePattern": "description of architecture/pattern used",
    "keyFindings": "Brief overview of main findings"
  },
  "criticalIssues": [
    {
      "severity": "critical|high|medium|low",
      "category": "security|performance|reliability|maintainability",
      "title": "Issue title",
      "description": "Detailed description",
      "files": ["file1.ts", "file2.js"],
      "recommendation": "How to fix this issue"
    }
  ],
  "potentialBugs": [
    {
      "file": "filename",
      "line": "line number or range",
      "issue": "Description of potential bug",
      "severity": "high|medium|low",
      "suggestion": "How to fix it"
    }
  ],
  "fileReviews": [
    {
      "file": "filename",
      "score": "A|B|C|D|F",
      "strengths": ["strength1", "strength2"],
      "issues": ["issue1", "issue2"],
      "suggestions": ["suggestion1", "suggestion2"]
    }
  ],
  "recommendations": {
    "immediate": ["Action items that should be addressed immediately"],
    "shortTerm": ["Improvements for next sprint/iteration"],
    "longTerm": ["Architectural or strategic improvements"]
  },
  "metrics": {
    "codeComplexity": "low|medium|high",
    "testCoverage": "estimate or 'unknown'",
    "documentationQuality": "excellent|good|fair|poor",
    "codeConsistency": "excellent|good|fair|poor"
  }
}

FILES TO REVIEW:
${fileList}

--- DETAILED FILE CONTENTS ---`;

  for (const f of state.files) {
    const content = f.content.length > 8000 ? f.content.slice(0, 8000) + "\n... (truncated for length)" : f.content;
    prompt += `\n\n=== ${f.filename} ===\n${content}\n`;
  }

  prompt += `\n\nPlease provide a thorough analysis following the JSON structure above. Focus on:
1. Code quality, security, and best practices
2. Potential bugs and reliability issues  
3. Performance considerations
4. Maintainability and readability
5. Architecture and design patterns
6. Testing and documentation
7. Any custom rules specified above

Return ONLY the JSON response, no additional text.`;

  const response = await llm.invoke([new HumanMessage(prompt)]);
  return {
    review: response.content as string,
    logs: [...state.logs, "Detailed code review completed."],
  };
};

const publisher = (state: AgentState): Partial<AgentState> => {
  const repoFull = `${state.owner}/${state.repo}@${state.branch}`;
  saveReview(state.userId, repoFull, state.commitHash, state.review);
  return { logs: [...state.logs, "Saved to history."] };
};

export const createGraph = () => {
  const graphBuilder = new StateGraph<AgentState>({
    channels: {
      userId: null,
      owner: null,
      repo: null,
      branch: null,
      files: null,
      commitHash: null,
      rules: null,
      review: null,
      logs: null,
    }
  })
    .addNode("history_checker", historyChecker)
    .addNode("review_agent", reviewAgent)
    .addNode("publisher", publisher);

  graphBuilder.addEdge(START, "history_checker");
  graphBuilder.addConditionalEdges(
    "history_checker",
    (s: AgentState) => (s.review?.includes("SKIPPED") ? END : "review_agent")
  );
  graphBuilder.addEdge("review_agent", "publisher");
  graphBuilder.addEdge("publisher", END);

  return graphBuilder.compile();
};
