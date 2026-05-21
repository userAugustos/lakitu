CREATE TABLE IF NOT EXISTS pending_actions (
  id TEXT PRIMARY KEY NOT NULL,
  agent_id TEXT NOT NULL REFERENCES agents(id),
  owner_id TEXT NOT NULL REFERENCES users(id),
  company_id TEXT NOT NULL REFERENCES companies(id),
  action TEXT NOT NULL,
  context TEXT NOT NULL,
  policy_hit TEXT NOT NULL,
  audit_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  resolution_note TEXT,
  resolved_by TEXT REFERENCES users(id),
  resolved_at INTEGER,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_pending_actions_owner ON pending_actions (owner_id);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_pending_actions_agent ON pending_actions (agent_id);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_pending_actions_status ON pending_actions (status);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_pending_actions_expires ON pending_actions (status, expires_at);
