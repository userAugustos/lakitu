ALTER TABLE users ADD COLUMN very_ai_subject_id TEXT;
--> statement-breakpoint
ALTER TABLE users ADD COLUMN very_ai_status TEXT NOT NULL DEFAULT 'unlinked';
--> statement-breakpoint
ALTER TABLE users ADD COLUMN very_ai_last_verification_at INTEGER;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_very_ai_subject_id ON users (very_ai_subject_id);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS very_ai_oauth_states (
  state TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL REFERENCES users(id),
  nonce TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_very_ai_oauth_states_user ON very_ai_oauth_states (user_id);
