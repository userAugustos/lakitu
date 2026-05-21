CREATE TABLE IF NOT EXISTS agent_permissions (
  id TEXT PRIMARY KEY NOT NULL,
  agent_id TEXT NOT NULL REFERENCES agents(id),
  action TEXT NOT NULL,
  policy_limits TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS uniq_agent_permissions_agent_action ON agent_permissions (agent_id, action);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_agent_permissions_agent ON agent_permissions (agent_id);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS permission_audit_log (
  id TEXT PRIMARY KEY NOT NULL,
  agent_id TEXT NOT NULL REFERENCES agents(id),
  user_id TEXT NOT NULL REFERENCES users(id),
  action TEXT NOT NULL,
  audit_action TEXT NOT NULL,
  old_policy_limits TEXT,
  new_policy_limits TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_permission_audit_agent ON permission_audit_log (agent_id, created_at);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_permission_audit_user ON permission_audit_log (user_id, created_at);
