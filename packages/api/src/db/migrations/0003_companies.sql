CREATE TABLE IF NOT EXISTS companies (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL UNIQUE,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);
--> statement-breakpoint
ALTER TABLE users ADD COLUMN company_id TEXT REFERENCES companies(id);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_users_company ON users (company_id);
