CREATE TABLE IF NOT EXISTS agents (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  owner_id TEXT NOT NULL REFERENCES users(id),
  company_id TEXT NOT NULL REFERENCES companies(id),
  ed25519_public_key TEXT NOT NULL,
  ed25519_private_key TEXT NOT NULL,
  clawkey_session_id TEXT,
  clawkey_status TEXT NOT NULL DEFAULT 'pending',
  clawkey_registered_at INTEGER,
  status TEXT NOT NULL DEFAULT 'active',
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_agents_owner ON agents (owner_id);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_agents_company ON agents (company_id);
