ALTER TABLE audit_logs ADD COLUMN previous_hash TEXT NOT NULL DEFAULT '';
--> statement-breakpoint
ALTER TABLE audit_logs ADD COLUMN row_hash TEXT NOT NULL DEFAULT '';
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_audit_logs_company_created ON audit_logs (company_id, created_at);
