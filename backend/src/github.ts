import { config } from "dotenv";
config();

const TOKEN = process.env.GITHUB_TOKEN!;
const headers = {
  Authorization: `Bearer ${TOKEN}`,
  Accept: "application/vnd.github.v3+json",
};

const isCodeFile = (path: string) => {
  const exts = ['.py', '.js', '.ts', '.tsx', '.java', '.cpp', '.c', '.h', '.html', '.css', '.json', '.md'];
  return exts.some(ext => path.endsWith(ext));
};

export async function* fetchBranchFiles(repoName: string, branch: string = "main") {
  yield "Getting branch SHA...";
  const branchRes = await fetch(`https://api.github.com/repos/${repoName}/branches/${branch}`, { headers });
  if (!branchRes.ok) throw new Error("Branch not found");
  const branchData = await branchRes.json();
  const sha = branchData.commit.sha;

  yield "Getting file tree...";
  const treeRes = await fetch(`https://api.github.com/repos/${repoName}/git/trees/${sha}?recursive=1`, { headers });
  const treeData = await treeRes.json();
  const items = treeData.tree.filter((i: any) => i.type === "blob" && isCodeFile(i.path));

  yield `Found ${items.length} code files. Fetching...`;
  const files: any[] = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (i % 5 === 0 || i === items.length - 1) {
      yield `Fetching file ${i + 1}/${items.length}...`;
    }
    const rawUrl = `https://raw.githubusercontent.com/${repoName}/${branch}/${item.path}`;
    const contentRes = await fetch(rawUrl, { headers: { Authorization: `Bearer ${TOKEN}` } });
    const content = contentRes.ok ? await contentRes.text() : "[Not available]";
    if (content.trim()) {
      files.push({ filename: item.path, content, encoding: "text" });
    }
  }

  yield `Fetched ${files.length} files.`;
  yield files;
}
