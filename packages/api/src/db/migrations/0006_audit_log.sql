CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY NOT NULL,
  audit_id TEXT NOT NULL,
  agent_id TEXT NOT NULL REFERENCES agents(id),
  owner_id TEXT NOT NULL REFERENCES users(id),
  company_id TEXT NOT NULL REFERENCES companies(id),
  action TEXT NOT NULL,
  decision TEXT NOT NULL,
  reasons TEXT NOT NULL,
  policy_hit TEXT,
  request_id TEXT,
  context TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_audit_logs_agent_created ON audit_logs (agent_id, created_at);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_audit_logs_owner_created ON audit_logs (owner_id, created_at);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_audit_logs_decision ON audit_logs (decision);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_audit_logs_audit_id ON audit_logs (audit_id);
