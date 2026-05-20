# lakitu — Platform Plan

> A platform that uses VeryAI Agent Verification (OAuth2 + ClawKey) to bind AI agents to verified humans, then lets each human manage what their agents are allowed to do across APIs and internal systems.

Reference docs the platform integrates with:

- `https://very.org/docs/developers/oauth2-integration`
- `https://very.org/docs/clawkey/introduction`

## 1. Identity & onboarding

- Email + OTP is the platform's primary login (existing).
- Every newly logged-in user enters an **onboarding** state until three conditions are met:
  1. Belongs to a company (see §9).
  2. VeryAI identity is linked via OAuth2 (`openid` + `offline_access`).
  3. VeryAI status is `verified`.
- VeryAI's OAuth2 docs expose only two scopes (`openid`, `offline_access`) and a `/userinfo` endpoint that returns a stable pairwise `sub` claim — no verification-status field, no re-verification trigger. Verification states are **our own model**: `unlinked` (hasn't started OAuth), `pending` (OAuth initiated, awaiting callback), `verified` (callback completed, `sub` persisted), `revoked` (manually unlinked). Persisted per user: `very_ai_subject_id`, `very_ai_status`, `very_ai_last_verification_at`.
- **Hard gate, enforced in two places:**
  - **API middleware** — every protected route requires `auth.user.onboarded === true`; otherwise responds `403 onboarding_required` with the next step.
  - **Web route guard** — TanStack Router beforeLoad checks onboarding state; redirects to `/onboarding/<step>` if incomplete.

## 2. Agents

- Each user creates, configures, and revokes their own agents. Owner is always the creator; company is inherited.
- **ClawKey-bound identity.** Every agent has an Ed25519 keypair. The public key is registered with ClawKey, which binds it to the owner's verified VeryAI identity through a single-use `registrationUrl` the owner completes.
- Persisted per agent: `agent_id`, name, owner, company, `ed25519_public_key`, `clawkey_session_id`, `clawkey_status` (pending / bound / revoked), status (active / revoked).
- **Private key never touches the platform.** The agent runtime holds it; the platform only stores the public key.
- Lifecycle: rotate key (creates new ClawKey binding), revoke (marks bound key invalid), restore.
- Inheritance of trust is **cryptographic, not transitive** — the gateway re-verifies the ClawKey binding on every call, not just at agent creation.

## 3. Permissions & policies per agent

- **Authoritative and persisted.** Permission grants and policy limits are first-class database records. No runtime inference from external state, no in-memory defaults — every check reads from the DB.
- Per-agent permission grants: a whitelist of action names (`create_payment`, `read_customer`, …). Default deny.
- Per-action policy limits: structured constraints (`max_amount`, `requires_verified_owner`, time windows, allowed counterparties, …) stored as typed JSON keyed by `(agent_id, action)`.
- Edited only by the agent's owner. Every edit produces an audit record so policy changes are reviewable later.

## 4. Gateway — the access control surface

- One endpoint: `POST /gateway/decide` with body `{agent_id, action, context}` and an **`Agent-Signature` header** containing an Ed25519 signature of a canonical request digest (nonce, timestamp, body hash).
- Checks, in order, every one persisted in the resulting audit row:
  1. Signature valid against the agent's registered public key.
  2. Nonce/timestamp fresh (replay protection).
  3. Agent is active in our DB.
  4. ClawKey binding is `bound` and the bound human is `verified` (verified via ClawKey's public verification endpoint).
  5. Owner is still a member of the agent's company.
  6. Agent has permission for the action.
  7. Context satisfies the action's policy limits.
  8. If policy demands human review → `approval_required` (see §6).
- Returns `{decision: allow | deny | approval_required, reasons[], audit_id, pending_action_id?}`.
- One audit row written per call, regardless of outcome.

## 5. Demo downstream — mock finance API

- A built-in mock service (`POST /demo/payments`) the gateway sits in front of for the showcase.
- The demo agent signs its request with its Ed25519 key; the mock service forwards to `/gateway/decide`, then executes (or rejects) accordingly.
- Demonstrates the canonical story end-to-end: `finance-agent` calling `create_payment $500` → allowed; `support-agent` calling the same → blocked with reason `support-agent does not have payment permission`.
- Architecture supports adding more mock downstreams (`support`, `hr`, …) without touching the gateway.

## 6. Pending actions & approval workflow

- When the gateway returns `approval_required`, the platform **queues a pending action**: persists `pending_action_id`, agent, action, context, policy that triggered approval, audit_id, expiry.
- The agent's owner gets an email (existing mailer / Mailpit in dev) with a deep link into the approval inbox.
- Owner approves or denies via `POST /pending-actions/{id}/approve` or `/deny` with an optional note.
- On **approve**: the platform triggers the original action immediately (calls the downstream / executes the side effect) and returns its result. The audit log gets a follow-up `approved` row.
- On **deny**: the pending action is closed; audit row written; the original caller can poll/subscribe to learn the outcome.
- Expired pending actions are auto-denied with reason `expired`.

## 7. Audit log

- One row per gateway decision and one row per approval event, written to a **dedicated SQLite table** (we're already on bun:sqlite — txt files would block search and filtering).
- Columns: `id`, `audit_id`, `agent_id`, `owner_id`, `company_id`, `action`, `decision`, `reasons` (JSON array), `policy_hit`, `request_id`, `context` (JSON), `created_at`. Indexed on `(agent_id, created_at)`, `(owner_id, created_at)`, `(decision)`.
- Append-only: no update or delete code paths exposed.
- Searchable in the owner console by agent, action, decision, and time window.

## 8. Owner console (web)

The single surface humans use. Built in the existing React + TanStack Router app.

- **Onboarding flow**: pick/create company → link VeryAI → done. Each step is its own route; progress visible.
- **Profile & VeryAI link state**: link / re-verify / unlink. Shows current `very_ai_status` and last verification.
- **Agents**: list, create (generates keypair guidance and shows the ClawKey `registrationUrl`), configure permissions, edit policies, rotate key, revoke. Shows ClawKey binding status.
- **Approval inbox**: pending items with full context; approve/deny with note.
- **Audit log viewer**: filter by agent / action / decision / time.
- **Company area**: which company you belong to, who else is in it. No admin features.

## 9. Companies — light membership only

- A user belongs to a company.
- Agents inherit the owner's company.
- **Onboarding step**: search-and-select an existing company **or** create a new one via a simple form (name, optional fields).
- Members can see each other in the company area. No company admin role, no company-wide policies, no member-management UI.

## 10. Not in scope

- No developer-facing SDK or public OpenAPI. The internal `/docs` endpoint stays gated to non-prod.
- No proxying of real upstream APIs. The gateway is a policy decision point; the mock finance API is the only downstream we host.
- No company admin console for policies or agent oversight.
- No agent runtime / hosting. Agents are external processes that hold their own Ed25519 private key and call our gateway; the platform never runs them.
