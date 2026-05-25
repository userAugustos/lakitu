DELETE FROM agent_permissions;
--> statement-breakpoint
ALTER TABLE agent_permissions RENAME COLUMN action TO tool_key;
--> statement-breakpoint
DROP INDEX IF EXISTS uniq_agent_permissions_agent_action;
--> statement-breakpoint
DROP INDEX IF EXISTS idx_agent_permissions_agent;
--> statement-breakpoint
CREATE UNIQUE INDEX uniq_agent_permissions_agent_tool ON agent_permissions(agent_id, tool_key);
--> statement-breakpoint
CREATE INDEX idx_agent_permissions_agent ON agent_permissions(agent_id);
--> statement-breakpoint
DELETE FROM pending_actions;
--> statement-breakpoint
ALTER TABLE pending_actions RENAME COLUMN action TO tool_key;
