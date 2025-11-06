import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '../../review_history.db');
const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS rules (
    user_id TEXT,
    repo_name TEXT,
    rules TEXT,
    PRIMARY KEY (user_id, repo_name)
  );
  CREATE TABLE IF NOT EXISTS history (
    user_id TEXT,
    repo_full TEXT,
    commit_hash TEXT,
    review_result TEXT,
    timestamp TEXT,
    PRIMARY KEY (user_id, repo_full)
  );
`);

export default db;
