# Lakitu

Agent validation and management platform. Lakitu officiates every agent run — kicking off evals, watching the track, and calling the finish.

## Architecture

```
apps/web/         React 19 SPA (Vite, TanStack Router)
packages/api/     Bun + Elysia API, Drizzle ORM (SQLite)
packages/ui/      Shared component library (shadcn + Tailwind v4)
```

## Features

### Authentication

Users authenticate via OTP email, then verify their identity through VeryAI OAuth to unlock agent management.

```mermaid
sequenceDiagram
    actor User
    participant API
    participant Mailer
    participant VeryAI

    User->>API: POST /auth/challenge { email }
    API->>Mailer: Send OTP code
    Mailer-->>User: Email with 6-digit code
    User->>API: POST /auth/verify { email, code }
    API-->>User: JWT token + user profile

    Note over User,VeryAI: Identity verification (onboarding)

    User->>API: POST /onboarding/very-ai/start
    API-->>User: authorize_url
    User->>VeryAI: OAuth2 authorize
    VeryAI-->>API: GET /onboarding/very-ai/callback { code }
    API->>VeryAI: Exchange code for token + userinfo
    API->>API: Mark user as verified
```

### Creating Agents

Each agent gets an Ed25519 key pair and registers with Clawkey for device binding. Clawkey acts as an external identity layer — the gateway won't allow actions from unregistered agents.

```mermaid
sequenceDiagram
    actor Owner
    participant API
    participant Clawkey

    Owner->>API: POST /agents { name, description }
    API->>API: Generate Ed25519 key pair
    API->>Clawkey: POST /agent/register/init { deviceId, publicKey, signature }
    Clawkey-->>API: { sessionId, registrationUrl }
    API-->>Owner: { agent, ed25519_private_key, registration_url }

    Note over Owner,Clawkey: Owner completes registration at Clawkey

    Owner->>API: GET /agents/:id/clawkey/status
    API->>Clawkey: GET /agent/register/{sessionId}/status
    Clawkey-->>API: { status: completed }
    API-->>Owner: Agent ready
```

### Gateway — Agent Action Decisions

The gateway is the core decision engine. When an agent wants to perform an action, the request goes through a multi-layer security pipeline before getting a decision.

```mermaid
flowchart TD
    A[Agent sends POST /gateway/decide] --> B{Valid Ed25519 signature?}
    B -- No --> DENY1[DENY: invalid signature]
    B -- Yes --> C{Timestamp within 5min?}
    C -- No --> DENY2[DENY: replay detected]
    C -- Yes --> D{Agent active?}
    D -- No --> DENY3[DENY: agent revoked]
    D -- Yes --> E{Clawkey registration complete?}
    E -- No --> DENY4[DENY: not registered]
    E -- Yes --> F{Owner VeryAI verified?}
    F -- No --> DENY5[DENY: owner not verified]
    F -- Yes --> G{Permission granted for action?}
    G -- No --> DENY6[DENY: no permission]
    G -- Yes --> H{Policy limits?}
    H -- No limits --> ALLOW[ALLOW]
    H -- Has limits --> I{Evaluate policies}
    I -- Violations --> DENY7[DENY: policy violated]
    I -- Requires approval --> PENDING[APPROVAL_REQUIRED + notify owner]
    I -- Passed --> ALLOW
```

Every decision — allow, deny, or approval_required — is recorded in the audit log with full context.

### Permissions & Policy Limits

Owners grant granular permissions per agent per action, with optional policy constraints.

```mermaid
flowchart LR
    subgraph Permission
        action["action: withdraw_funds"]
        policy["policy_limits (optional)"]
    end

    subgraph Policy Constraints
        max["max_amount: 10000"]
        hours["allowed_hours: 09:00–17:00 UTC"]
        approval["requires_approval: true"]
    end

    policy --> max
    policy --> hours
    policy --> approval
```

- **max_amount** — ceiling on `context.amount`
- **allowed_hours** — time window enforcement (handles UTC wraparound)
- **requires_approval** — triggers a pending action instead of auto-allowing

### Pending Actions & Approval Flow

When a policy sets `requires_approval`, the gateway creates a pending action and notifies the owner via email.

```mermaid
sequenceDiagram
    actor Agent
    participant Gateway
    participant API
    participant Mailer
    actor Owner

    Agent->>Gateway: POST /gateway/decide { action, context }
    Gateway->>Gateway: Policy requires approval
    Gateway->>API: Create pending action (24h expiry)
    Gateway->>Mailer: Send approval notification
    Mailer-->>Owner: Email with review link
    Gateway-->>Agent: { decision: approval_required, pending_action_id }

    Owner->>API: POST /pending-actions/:id/approve
    API-->>Owner: { status: approved }
```

Pending actions expire after 24 hours if not resolved.

### Companies & Onboarding

Users belong to a company. Company membership is required to create and manage agents. The onboarding flow guides users through company creation or joining after authentication.

## Email Templates

Lakitu uses [React Email](https://react.email) templates rendered server-side.

| Template              | Purpose                    | Preview        |
| --------------------- | -------------------------- | -------------- |
| **OTP Code**          | Sign-in verification code  | <img width="1041" height="615" alt="image" src="https://github.com/user-attachments/assets/ebc746a6-4230-4eca-b9af-2629dc2c4b25" /> |
| **Welcome**           | Post-signup greeting       | <img width="1041" height="615" alt="image" src="https://github.com/user-attachments/assets/6be1a494-9450-4787-bf3c-6df611f92a97" /> |
| **Approval Required** | Agent needs owner approval | <img width="1041" height="615" alt="image" src="https://github.com/user-attachments/assets/dab7231e-8480-4213-84ec-a556ec856b41" /> |

## Security Highlights

- **Ed25519 signatures** on every gateway request with canonical JSON body hashing
- **Replay protection** via 5-minute timestamp window + nonce
- **Clawkey device binding** — agents must complete external registration before operating
- **VeryAI identity verification** — agent owners must verify identity via OAuth
- **Policy enforcement** — amount limits, time windows, and approval gates evaluated per request
- **Full audit trail** — every decision, permission change, and agent lifecycle event is logged
