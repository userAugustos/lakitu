CREATE TRIGGER IF NOT EXISTS trg_audit_logs_protect_chain
BEFORE UPDATE ON audit_logs
WHEN NEW.row_hash != OLD.row_hash
  OR NEW.previous_hash != OLD.previous_hash
  OR NEW.action != OLD.action
  OR NEW.decision != OLD.decision
  OR NEW.reasons != OLD.reasons
  OR NEW.agent_id != OLD.agent_id
  OR NEW.owner_id != OLD.owner_id
  OR NEW.company_id != OLD.company_id
  OR NEW.audit_id != OLD.audit_id
  OR NEW.created_at != OLD.created_at
BEGIN
  SELECT RAISE(ABORT, 'audit_logs chain fields are immutable');
END;
--> statement-breakpoint
CREATE TRIGGER IF NOT EXISTS trg_audit_logs_no_delete
BEFORE DELETE ON audit_logs
BEGIN
  SELECT RAISE(ABORT, 'audit_logs rows cannot be deleted');
END;
