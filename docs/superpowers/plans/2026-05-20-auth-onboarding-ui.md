# Auth + Onboarding UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the complete auth verification and onboarding UI -- email OTP login, company setup, VeryAI OAuth link -- governed by an XState v5 state machine, using the existing API endpoints and the split-screen design from the design mockup.

**Architecture:** A single XState v5 machine (`authSetupMachine`) governs the entire flow from initial verification through email challenge, OTP verification, company creation/join, VeryAI OAuth link, to final authenticated state. The machine lives in the `/login` route and drives all screen transitions via a `screen` context property. No sub-routes for individual steps -- the URL stays at `/login` throughout. The existing `/onboarding/$step` and `/onboarding/route.tsx` routes are deleted. The `/_authenticated` layout guard redirects to `/login` for unauthenticated or un-onboarded users. On reaching the `authenticated` final state, the machine writes to the Zustand auth store and navigates to the dashboard.

**Tech Stack:** XState v5 + @xstate/react, react-hook-form + @hookform/resolvers/zod, zod, shadcn/ui components (Input, InputOTP, Label, Sonner), Tailwind v4 custom CSS for the split-screen layout.

---

## Prerequisites

### API Change Required (Out of Scope for This Plan)

The VeryAI OAuth callback endpoint (`GET /onboarding/very-ai/callback`) currently returns JSON. For the OAuth redirect flow to work end-to-end, this endpoint must be updated to redirect to `{FRONTEND_URL}/login` after processing. Until this is done, the VeryAI step will redirect users to the authorize URL, but after the OAuth callback the user will see raw JSON and must manually navigate back to `/login`. The frontend code handles re-entry correctly regardless.

---

## File Structure

### New Files

| Path                                                        | Responsibility                                                                                    |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `apps/web/src/modules/auth/auth-setup.machine.ts`           | XState v5 machine definition: states, events, context, guards, actions, actors (invoked services) |
| `apps/web/src/modules/auth/auth-setup.types.ts`             | TypeScript types for machine context, events, and screen discriminant                             |
| `apps/web/src/modules/auth/auth-setup.schemas.ts`           | Zod schemas for email, OTP, company forms                                                         |
| `apps/web/src/modules/auth/auth-setup.api.ts`               | API call functions used by the machine's invoked actors -- thin wrappers around Eden Treaty calls |
| `apps/web/src/modules/auth/components/auth-layout.tsx`      | Split-screen layout: brand panel (left) + form panel (right)                                      |
| `apps/web/src/modules/auth/components/brand-panel.tsx`      | Left-side brand panel: sky gradient, clouds, mascot, copy, checkered stripe                       |
| `apps/web/src/modules/auth/components/form-panel.tsx`       | Right-side panel: step indicator, title/subtitle, screen slot, footer                             |
| `apps/web/src/modules/auth/components/email-screen.tsx`     | Email input form with react-hook-form                                                             |
| `apps/web/src/modules/auth/components/otp-screen.tsx`       | OTP 6-digit input form with auto-submit, shake animation, resend timer                            |
| `apps/web/src/modules/auth/components/company-screen.tsx`   | Company creation or join form with search                                                         |
| `apps/web/src/modules/auth/components/very-ai-screen.tsx`   | VeryAI OAuth redirect screen with loading state                                                   |
| `apps/web/src/modules/auth/components/success-screen.tsx`   | "Green flag" success animation before redirect                                                    |
| `apps/web/src/modules/auth/components/error-screen.tsx`     | Fatal error screen with retry button                                                              |
| `apps/web/src/modules/auth/components/step-indicator.tsx`   | Step progress pill (1-2-3-4 dots with lines)                                                      |
| `apps/web/src/modules/auth/components/cloud.tsx`            | SVG cloud component for brand panel                                                               |
| `apps/web/src/modules/auth/components/lakitu-logo.tsx`      | SVG Lakitu logo mark component                                                                    |
| `apps/web/src/modules/auth/components/checkered-stripe.tsx` | SVG checkered stripe for brand panel bottom                                                       |
| `apps/web/src/modules/auth/lib/jwt-decode.ts`               | Client-side JWT payload decoder (base64url decode, no verification)                               |
| `apps/web/src/modules/auth/auth-setup.css`                  | Custom CSS for auth layout (sky gradient, clouds, OTP cells, animations)                          |
| `packages/ui/src/shadcn/input.tsx`                          | shadcn Input component                                                                            |
| `packages/ui/src/shadcn/input-otp.tsx`                      | shadcn InputOTP component                                                                         |
| `packages/ui/src/shadcn/label.tsx`                          | shadcn Label component                                                                            |
| `packages/ui/src/shadcn/sonner.tsx`                         | shadcn Sonner (toast) component                                                                   |

### Modified Files

| Path                                      | Change                                                                                             |
| ----------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `apps/web/src/routes/login.tsx`           | Replace placeholder with machine-driven auth-setup UI                                              |
| `apps/web/src/routes/_authenticated.tsx`  | Simplify: only check token validity + onboarding completeness, redirect to `/login`                |
| `apps/web/src/modules/auth/auth.store.ts` | Add `returnUrl` field and `setReturnUrl` action                                                    |
| `apps/web/src/main.tsx`                   | Export router instance for machine navigation                                                      |
| `apps/web/src/modules/core/lib/env.ts`    | No changes needed -- existing `webEnv` suffices                                                    |
| `apps/web/src/__sdk-smoke.ts`             | No changes needed                                                                                  |
| `apps/web/package.json`                   | New dependencies: xstate, @xstate/react, react-hook-form, @hookform/resolvers, input-otp, sonner   |
| `packages/ui/package.json`                | New dependencies: @radix-ui/react-label, input-otp, sonner, @radix-ui/react-slot (already present) |
| `packages/ui/src/styles/index.css`        | Add font imports (Bricolage Grotesque, Geist, Geist Mono)                                          |

### Deleted Files

| Path                                                  | Reason                                                      |
| ----------------------------------------------------- | ----------------------------------------------------------- |
| `apps/web/src/routes/onboarding/route.tsx`            | Onboarding steps now handled within `/login` by the machine |
| `apps/web/src/routes/onboarding/$step.tsx`            | Same as above                                               |
| `apps/web/src/modules/onboarding/onboarding.utils.ts` | No longer needed -- machine handles step routing internally |

---

## State Machine Design

### States

```
verification --> email --> otp --> company --> veryAi --> success --> authenticated (final)
                                                                         |
                                                        error <----------+--- (from any state)
```

**States:**

1. **`verification`** (initial) -- invoke: checks localStorage for token, decodes JWT exp, if valid calls `GET /onboarding/status`. Transitions to the correct step based on result. No token or expired token goes to `email`.
2. **`email`** -- renders email form. On `SUBMIT_EMAIL`, invoke: `POST /auth/challenge`. On success, transition to `otp`.
3. **`otp`** -- renders OTP form. On `SUBMIT_OTP`, invoke: `POST /auth/verify`. On success with token, check onboarding status. Transition to `company`, `veryAi`, or `success` based on `next_step`.
4. **`company`** -- renders company form. On `CREATE_COMPANY`, invoke: `POST /companies`. On `JOIN_COMPANY`, invoke: `POST /companies/:id/join`. On success, re-check onboarding status and proceed.
5. **`veryAi`** -- renders VeryAI screen. On entry, invoke: `POST /onboarding/very-ai/start`, get authorize URL, redirect browser. When user returns to `/login`, the `verification` state re-runs and routes past this step if VeryAI is now satisfied.
6. **`success`** -- renders success animation for 1.5s, then transitions to `authenticated`.
7. **`authenticated`** (final) -- entry action: writes user + token to Zustand, navigates to dashboard (or returnUrl).
8. **`error`** -- renders error screen. On `RETRY`, transition back to `verification` (re-resolve position).

### Context

```typescript
interface AuthSetupContext {
  screen: AuthScreen; // discriminant for which component to render
  email: string;
  challengeId: string | null;
  token: string | null;
  user: User | null;
  onboardingStatus: OnboardingStatus | null;
  error: { message: string; code?: string } | null;
  retryCount: number;
}

type AuthScreen =
  | 'loading' // verification state
  | 'email'
  | 'otp'
  | 'company'
  | 'very-ai'
  | 'success'
  | 'error';
```

### Events

```typescript
type AuthSetupEvent =
  | { type: 'SUBMIT_EMAIL'; email: string }
  | { type: 'SUBMIT_OTP'; code: string }
  | { type: 'BACK_TO_EMAIL' }
  | { type: 'CREATE_COMPANY'; name: string }
  | { type: 'JOIN_COMPANY'; companyId: string }
  | { type: 'RETRY' }
  | { type: 'LOGOUT' };
```

### Invoked Actors (Services)

Each async operation is an XState v5 `fromPromise` actor:

1. **`resolvePosition`** -- used in `verification` state. Reads token from localStorage, decodes exp, if valid calls `GET /onboarding/status`. Returns `{ token, user, onboardingStatus }` or `null`.
2. **`sendChallenge`** -- used in `email` state. Calls `POST /auth/challenge` with `{ email }`. Returns `{ challengeId }`.
3. **`verifyOtp`** -- used in `otp` state. Calls `POST /auth/verify` with `{ email, code }`. Returns `{ token, user }`.
4. **`checkOnboardingStatus`** -- shared helper. Calls `GET /onboarding/status`. Returns `OnboardingStatus`.
5. **`createCompany`** -- used in `company` state. Calls `POST /companies` with `{ name }`. Returns `Company`.
6. **`joinCompany`** -- used in `company` state. Calls `POST /companies/:id/join`. Returns `{ ok }`.
7. **`startVeryAiLink`** -- used in `veryAi` state. Calls `POST /onboarding/very-ai/start`. Returns `{ authorize_url }`.

### Guards

- **`hasValidToken`** -- check if resolved position has a non-expired token.
- **`isOnboarded`** -- check if `onboardingStatus.onboarded === true`.
- **`needsCompany`** -- check if `onboardingStatus.next_step === 'company'`.
- **`needsVeryAi`** -- check if `next_step` is `very_ai_link`, `very_ai_verify`, or `very_ai_reverify`.
- **`canRetry`** -- check if `retryCount < 3`.

### Machine Flow Detail

The `otp` state and `company` state both need a two-phase pattern: (1) call the main action (verify OTP / create or join company), then (2) check onboarding status to decide the next step. This is modeled as a compound state with child states:

```
otp:
  idle -> submitting (invoke verifyOtp)
       -> checkingStatus (invoke checkOnboardingStatus)
       -> done (transition to company / veryAi / success based on status)

company:
  idle -> submitting (invoke createCompany or joinCompany)
       -> checkingStatus (invoke checkOnboardingStatus)
       -> done (transition to veryAi / success based on status)
```

The `veryAi` state is simpler: invoke `startVeryAiLink`, on success redirect the browser. When the user returns, the machine starts fresh in `verification` which re-resolves position.

---

## Form Schemas

```typescript
// apps/web/src/modules/auth/auth-setup.schemas.ts

import { z } from 'zod';

export const emailSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});
export type EmailFormValues = z.infer<typeof emailSchema>;

export const otpSchema = z.object({
  code: z
    .string()
    .length(6, 'Code must be 6 digits')
    .regex(/^\d{6}$/, 'Code must be 6 digits'),
});
export type OtpFormValues = z.infer<typeof otpSchema>;

export const createCompanySchema = z.object({
  name: z.string().min(1, 'Company name is required').max(100, 'Company name is too long'),
});
export type CreateCompanyFormValues = z.infer<typeof createCompanySchema>;

// joinCompany does not need a form schema -- it is a button click with a selected company ID
```

---

## Component Hierarchy

```
LoginPage (routes/login.tsx)
  -- creates machine actor, provides via React context
  |
  AuthLayout
  +-- BrandPanel
  |   +-- LakituLogo
  |   +-- Cloud (x4)
  |   +-- CheckeredStripe
  |
  +-- FormPanel
      +-- StepIndicator
      +-- Title / Subtitle (derived from screen)
      +-- [screen switch]
      |   +-- EmailScreen (useForm + emailSchema)
      |   +-- OtpScreen (useForm + otpSchema, InputOTP)
      |   +-- CompanyScreen (useForm + createCompanySchema, search + select)
      |   +-- VeryAiScreen (loading spinner, auto-redirect)
      |   +-- SuccessScreen (checkmark animation, loader bar)
      |   +-- ErrorScreen (retry button)
      |   +-- LoadingScreen (spinner during verification)
      +-- Footer
      +-- LogoutButton (absolute top-right, hidden on email screen)
```

---

## Zustand Store Changes

```typescript
// auth.store.ts -- add returnUrl

interface AuthState {
  user: User | null;
  token: string | null;
  returnUrl: string | null; // NEW
}

export const authActions = {
  // ... existing actions unchanged ...
  setReturnUrl(url: string | null) {
    useAuthStore.setState({ returnUrl: url });
  },
  getReturnUrl(): string | null {
    return useAuthStore.getState().returnUrl;
  },
};
```

The `_authenticated.tsx` guard sets `returnUrl` before redirecting to `/login`. The machine's `authenticated` final state reads it and navigates there (defaulting to `/dashboard`).

---

## Task Breakdown

### Task 1: Install Dependencies

**Files:**

- Modify: `apps/web/package.json`
- Modify: `packages/ui/package.json`

- [ ] **Step 1: Install web app dependencies**

```bash
cd /Users/augustos/dev/lakitu && bun add --cwd apps/web xstate @xstate/react react-hook-form @hookform/resolvers
```

These are the runtime dependencies for the web app: XState v5 for the state machine, @xstate/react for React bindings, react-hook-form for form state, @hookform/resolvers for Zod integration.

- [ ] **Step 2: Install UI package dependencies for shadcn components**

```bash
cd /Users/augustos/dev/lakitu && bun add --cwd packages/ui input-otp sonner @radix-ui/react-label
```

These are peer dependencies that shadcn components need: `input-otp` for the OTP input, `sonner` for toast notifications, `@radix-ui/react-label` for the Label primitive.

- [ ] **Step 3: Verify installation**

```bash
cd /Users/augustos/dev/lakitu && bun install
```

Expected: clean install, no errors. The lockfile updates.

- [ ] **Step 4: Commit**

```bash
cd /Users/augustos/dev/lakitu && git add apps/web/package.json packages/ui/package.json bun.lock && git commit -m "$(cat <<'EOF'
feat(web): add xstate, react-hook-form, and shadcn component deps
EOF
)"
```

---

### Task 2: Add shadcn Components (Input, InputOTP, Label, Sonner)

**Files:**

- Create: `packages/ui/src/shadcn/input.tsx`
- Create: `packages/ui/src/shadcn/input-otp.tsx`
- Create: `packages/ui/src/shadcn/label.tsx`
- Create: `packages/ui/src/shadcn/sonner.tsx`

**Important context:** The existing `button.tsx` in `packages/ui/src/shadcn/` imports from `../lib/utils` using a relative path. All new shadcn components must follow this same pattern. The `components.json` has `aliases.utils` set to `src/lib/utils` and `aliases.ui` set to `src/shadcn`.

- [ ] **Step 1: Add Input component**

Create `packages/ui/src/shadcn/input.tsx`:

```tsx
import * as React from 'react';

import { cn } from '../lib/utils';

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export { Input };
```

- [ ] **Step 2: Add Label component**

Create `packages/ui/src/shadcn/label.tsx`:

```tsx
import * as LabelPrimitive from '@radix-ui/react-label';
import { cva } from 'class-variance-authority';
import * as React from 'react';
import type { VariantProps } from 'class-variance-authority';

import { cn } from '../lib/utils';

const labelVariants = cva(
  'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'
);

const Label = React.forwardRef<
  React.ComponentRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> & VariantProps<typeof labelVariants>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root ref={ref} className={cn(labelVariants(), className)} {...props} />
));
Label.displayName = LabelPrimitive.Root.displayName;

export { Label };
```

- [ ] **Step 3: Add InputOTP component**

Create `packages/ui/src/shadcn/input-otp.tsx`:

```tsx
import { OTPInput, OTPInputContext } from 'input-otp';
import * as React from 'react';

import { cn } from '../lib/utils';

const InputOTP = React.forwardRef<
  React.ComponentRef<typeof OTPInput>,
  React.ComponentPropsWithoutRef<typeof OTPInput>
>(({ className, containerClassName, ...props }, ref) => (
  <OTPInput
    ref={ref}
    containerClassName={cn('flex items-center gap-2 has-disabled:opacity-50', containerClassName)}
    className={cn('disabled:cursor-not-allowed', className)}
    {...props}
  />
));
InputOTP.displayName = 'InputOTP';

const InputOTPGroup = React.forwardRef<
  React.ComponentRef<'div'>,
  React.ComponentPropsWithoutRef<'div'>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('flex items-center', className)} {...props} />
));
InputOTPGroup.displayName = 'InputOTPGroup';

const InputOTPSlot = React.forwardRef<
  React.ComponentRef<'div'>,
  React.ComponentPropsWithoutRef<'div'> & { index: number }
>(({ index, className, ...props }, ref) => {
  const inputOTPContext = React.useContext(OTPInputContext);
  const slot = inputOTPContext.slots[index];
  if (!slot) return null;
  const { char, hasFakeCaret, isActive } = slot;

  return (
    <div
      ref={ref}
      className={cn(
        'border-input relative flex h-10 w-10 items-center justify-center border-y border-r text-sm transition-all first:rounded-l-md first:border-l last:rounded-r-md',
        isActive && 'ring-ring ring-offset-background z-10 ring-2 ring-offset-0',
        className
      )}
      {...props}
    >
      {char}
      {hasFakeCaret && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="animate-caret-blink bg-foreground h-4 w-px duration-1000" />
        </div>
      )}
    </div>
  );
});
InputOTPSlot.displayName = 'InputOTPSlot';

const InputOTPSeparator = React.forwardRef<
  React.ComponentRef<'div'>,
  React.ComponentPropsWithoutRef<'div'>
>(({ ...props }, ref) => (
  <div ref={ref} role="separator" {...props}>
    <span className="text-muted-foreground">-</span>
  </div>
));
InputOTPSeparator.displayName = 'InputOTPSeparator';

export { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot };
```

- [ ] **Step 4: Add Sonner (toast) component**

Create `packages/ui/src/shadcn/sonner.tsx`:

```tsx
import { Toaster as Sonner } from 'sonner';
import type { ComponentProps } from 'react';

type ToasterProps = ComponentProps<typeof Sonner>;

function Toaster({ ...props }: ToasterProps) {
  return (
    <Sonner
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            'group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg',
          description: 'group-[.toast]:text-muted-foreground',
          actionButton: 'group-[.toast]:bg-primary group-[.toast]:text-primary-foreground',
          cancelButton: 'group-[.toast]:bg-muted group-[.toast]:text-muted-foreground',
        },
      }}
      {...props}
    />
  );
}

export { Toaster };
```

- [ ] **Step 5: Verify types compile**

```bash
cd /Users/augustos/dev/lakitu && bun --filter @repo/ui typecheck
```

Expected: no type errors.

- [ ] **Step 6: Commit**

```bash
cd /Users/augustos/dev/lakitu && git add packages/ui/src/shadcn/input.tsx packages/ui/src/shadcn/input-otp.tsx packages/ui/src/shadcn/label.tsx packages/ui/src/shadcn/sonner.tsx && git commit -m "$(cat <<'EOF'
feat(ui): add Input, InputOTP, Label, and Sonner shadcn components
EOF
)"
```

---

### Task 3: Add Font Imports

**Files:**

- Modify: `packages/ui/src/styles/index.css`

The design uses Bricolage Grotesque (headings), Geist (body), and Geist Mono (code/OTP). The existing global stylesheet at `packages/ui/src/styles/index.css` is where font imports belong.

- [ ] **Step 1: Add Google Fonts import to the global stylesheet**

Add the following at the very top of `packages/ui/src/styles/index.css`, **before** the `@import 'tailwindcss'` line:

```css
@import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@600;700;800&family=Geist:wght@400;500;600;700&family=Geist+Mono:wght@400;500;600&display=swap');
```

Then add font family custom properties in the existing `@theme inline` block:

```css
--font-sans: 'Geist', -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif;
--font-mono: 'Geist Mono', ui-monospace, monospace;
--font-display: 'Bricolage Grotesque', 'Geist', sans-serif;
```

- [ ] **Step 2: Update `body` base layer to use the new font**

In the existing `@layer base` block that sets `body` styles, add font-family:

```css
body {
  @apply bg-background text-foreground antialiased;
  font-family: var(--font-sans);
}
```

- [ ] **Step 3: Verify the stylesheet compiles**

```bash
cd /Users/augustos/dev/lakitu && bun --filter web build 2>&1 | head -20
```

Expected: no errors from CSS processing.

- [ ] **Step 4: Commit**

```bash
cd /Users/augustos/dev/lakitu && git add packages/ui/src/styles/index.css && git commit -m "$(cat <<'EOF'
feat(ui): add Bricolage Grotesque, Geist, and Geist Mono font imports
EOF
)"
```

---

### Task 4: Copy Mascot Asset to Web Public Directory

**Files:**

- Create: `apps/web/public/lakitu-world.png` (copied from `design/lakitu/assets/lakitu-world.png`)

The brand panel uses the Lakitu mascot image. Static assets served by Vite go in `apps/web/public/`.

- [ ] **Step 1: Copy the mascot image**

```bash
cp /Users/augustos/dev/lakitu/design/lakitu/assets/lakitu-world.png /Users/augustos/dev/lakitu/apps/web/public/lakitu-world.png
```

- [ ] **Step 2: Commit**

```bash
cd /Users/augustos/dev/lakitu && git add apps/web/public/lakitu-world.png && git commit -m "$(cat <<'EOF'
feat(web): add Lakitu mascot image for auth brand panel
EOF
)"
```

---

### Task 5: Client-Side JWT Decoder

**Files:**

- Create: `apps/web/src/modules/auth/lib/jwt-decode.ts`

The machine's `verification` state needs to decode the JWT payload to check `exp` without making an API call. This is a client-side decode only (no signature verification -- that happens server-side). The API's JWT uses standard base64url encoding for the payload (see `packages/api/src/modules/auth/lib/jwt.ts` lines 17-19 for the encoding format).

- [ ] **Step 1: Create the JWT decoder**

Create `apps/web/src/modules/auth/lib/jwt-decode.ts`:

```typescript
interface JwtPayload {
  sub: string;
  email: string;
  exp?: number;
  iat?: number;
}

function base64urlDecode(input: string): string {
  const padded = input.replace(/-/g, '+').replace(/_/g, '/') + '=='.slice((input.length + 2) % 4);
  return atob(padded);
}

export function decodeJwtPayload(token: string): JwtPayload | null {
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  try {
    const json = base64urlDecode(parts[1]!);
    return JSON.parse(json) as JwtPayload;
  } catch {
    return null;
  }
}

export function isTokenExpired(token: string): boolean {
  const payload = decodeJwtPayload(token);
  if (!payload?.exp) return true;
  const nowSeconds = Math.floor(Date.now() / 1000);
  return payload.exp < nowSeconds;
}
```

- [ ] **Step 2: Commit**

```bash
cd /Users/augustos/dev/lakitu && git add apps/web/src/modules/auth/lib/jwt-decode.ts && git commit -m "$(cat <<'EOF'
feat(auth): add client-side JWT payload decoder for token expiry check
EOF
)"
```

---

### Task 6: Auth Setup Types

**Files:**

- Create: `apps/web/src/modules/auth/auth-setup.types.ts`

Define all TypeScript types the machine and components will use. These are local to the auth module -- they do not go through the SDK.

- [ ] **Step 1: Create the types file**

Create `apps/web/src/modules/auth/auth-setup.types.ts`:

```typescript
import type { User } from '@lakitu/api/auth';
import type { OnboardingStatus } from '@lakitu/api/onboarding';

export type AuthScreen = 'loading' | 'email' | 'otp' | 'company' | 'very-ai' | 'success' | 'error';

export interface AuthSetupContext {
  screen: AuthScreen;
  email: string;
  challengeId: string | null;
  token: string | null;
  user: User | null;
  onboardingStatus: OnboardingStatus | null;
  error: { message: string; code?: string } | null;
  retryCount: number;
}

export type AuthSetupEvent =
  | { type: 'SUBMIT_EMAIL'; email: string }
  | { type: 'SUBMIT_OTP'; code: string }
  | { type: 'BACK_TO_EMAIL' }
  | { type: 'CREATE_COMPANY'; name: string }
  | { type: 'JOIN_COMPANY'; companyId: string }
  | { type: 'RETRY' }
  | { type: 'LOGOUT' };
```

- [ ] **Step 2: Commit**

```bash
cd /Users/augustos/dev/lakitu && git add apps/web/src/modules/auth/auth-setup.types.ts && git commit -m "$(cat <<'EOF'
feat(auth): define auth-setup machine context and event types
EOF
)"
```

---

### Task 7: Auth Setup Form Schemas

**Files:**

- Create: `apps/web/src/modules/auth/auth-setup.schemas.ts`

- [ ] **Step 1: Create the schemas file**

Create `apps/web/src/modules/auth/auth-setup.schemas.ts`:

```typescript
import { z } from 'zod';

export const emailSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});
export type EmailFormValues = z.infer<typeof emailSchema>;

export const otpSchema = z.object({
  code: z
    .string()
    .length(6, 'Code must be 6 digits')
    .regex(/^\d{6}$/, 'Code must be 6 digits'),
});
export type OtpFormValues = z.infer<typeof otpSchema>;

export const createCompanySchema = z.object({
  name: z.string().min(1, 'Company name is required').max(100, 'Company name is too long'),
});
export type CreateCompanyFormValues = z.infer<typeof createCompanySchema>;
```

- [ ] **Step 2: Commit**

```bash
cd /Users/augustos/dev/lakitu && git add apps/web/src/modules/auth/auth-setup.schemas.ts && git commit -m "$(cat <<'EOF'
feat(auth): add Zod form schemas for email, OTP, and company steps
EOF
)"
```

---

### Task 8: Auth Setup API Functions

**Files:**

- Create: `apps/web/src/modules/auth/auth-setup.api.ts`

These are thin wrappers around the Eden Treaty calls, used as XState invoked actors. They use the existing `apiCall`, `lakituPublicApi`, and `lakituAuthApi` from `apps/web/src/api.ts`.

- [ ] **Step 1: Create the API functions file**

Create `apps/web/src/modules/auth/auth-setup.api.ts`:

```typescript
import type { ChallengeResponse, User, VerifyResponse } from '@lakitu/api/auth';
import type { Company, SearchCompaniesResponse } from '@lakitu/api/companies';
import type { OnboardingStatus } from '@lakitu/api/onboarding';

import { apiCall, lakituAuthApi, lakituPublicApi } from '@/api';

export async function sendChallenge(email: string): Promise<ChallengeResponse> {
  return apiCall<ChallengeResponse>(() => lakituPublicApi.auth.challenge.post({ email }));
}

export async function verifyOtp(email: string, code: string): Promise<VerifyResponse> {
  return apiCall<VerifyResponse>(() => lakituPublicApi.auth.verify.post({ email, code }));
}

export async function fetchProfile(): Promise<User> {
  return apiCall<User>(() => lakituAuthApi.auth.profile.get());
}

export async function fetchOnboardingStatus(): Promise<OnboardingStatus> {
  return apiCall<OnboardingStatus>(() => lakituAuthApi.onboarding.status.get());
}

export async function createCompany(name: string): Promise<Company> {
  return apiCall<Company>(() => lakituAuthApi.companies.index.post({ name }));
}

export async function joinCompany(companyId: string): Promise<{ ok: boolean }> {
  return apiCall<{ ok: boolean }>(() => lakituAuthApi.companies({ id: companyId }).join.post());
}

export async function searchCompanies(query: string): Promise<SearchCompaniesResponse> {
  return apiCall<SearchCompaniesResponse>(() =>
    lakituAuthApi.companies.index.get({ query: { q: query } })
  );
}

export async function startVeryAiLink(): Promise<{ authorize_url: string }> {
  return apiCall<{ authorize_url: string }>(() => lakituAuthApi.onboarding['very-ai'].start.post());
}
```

**Important note for the dev agent:** The exact Eden Treaty call syntax depends on how Elysia routes map to the Eden client. The routes are:

- `POST /auth/challenge` -> `lakituPublicApi.auth.challenge.post(...)`
- `POST /auth/verify` -> `lakituPublicApi.auth.verify.post(...)`
- `GET /auth/profile` -> `lakituAuthApi.auth.profile.get()`
- `GET /onboarding/status` -> `lakituAuthApi.onboarding.status.get()`
- `POST /companies` -> `lakituAuthApi.companies.index.post(...)` (verify this -- may just be `lakituAuthApi.companies.post(...)`)
- `GET /companies?q=...` -> `lakituAuthApi.companies.index.get({ query: { q } })` (verify this)
- `POST /companies/:id/join` -> needs verification of Eden Treaty dynamic route syntax
- `POST /onboarding/very-ai/start` -> `lakituAuthApi.onboarding['very-ai'].start.post()`

The dev agent MUST verify the exact Eden Treaty call signatures by checking how existing calls work in `apps/web/src/api.ts` and `apps/web/src/routes/index.tsx`, and by running `bun typecheck` after creating the file. Eden Treaty maps Elysia routes to chained property access -- dynamic segments like `:id` become function calls (e.g., `.companies({ id: '...' })`).

- [ ] **Step 2: Run typecheck to verify Eden call shapes**

```bash
cd /Users/augustos/dev/lakitu && bun build:sdk && bun --filter web typecheck
```

Expected: no type errors. If there are errors on the Eden call syntax, fix the call shapes to match what the type system expects.

- [ ] **Step 3: Commit**

```bash
cd /Users/augustos/dev/lakitu && git add apps/web/src/modules/auth/auth-setup.api.ts && git commit -m "$(cat <<'EOF'
feat(auth): add API call wrappers for auth-setup machine actors
EOF
)"
```

---

### Task 9: Zustand Store Updates

**Files:**

- Modify: `apps/web/src/modules/auth/auth.store.ts`

Add `returnUrl` to the store so the `_authenticated` guard can tell the machine where to redirect after auth.

- [ ] **Step 1: Update the auth store**

In `apps/web/src/modules/auth/auth.store.ts`, add `returnUrl` to the state interface and add `setReturnUrl`/`getReturnUrl` to `authActions`:

The full updated file should be:

```typescript
import { create } from 'zustand';

import type { User } from '@lakitu/api/auth';

interface AuthState {
  user: User | null;
  token: string | null;
  returnUrl: string | null;
}

export const useAuthStore = create<AuthState>(() => ({ user: null, token: null, returnUrl: null }));

const TOKEN_KEY = 'auth_token';

export const authActions = {
  login(user: User, token: string) {
    useAuthStore.setState({ user, token });
    localStorage.setItem(TOKEN_KEY, token);
  },
  logout() {
    useAuthStore.setState({ user: null, token: null, returnUrl: null });
    localStorage.removeItem(TOKEN_KEY);
  },
  hydrate() {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) useAuthStore.setState({ token });
  },
  getToken(): string | null {
    return useAuthStore.getState().token ?? localStorage.getItem(TOKEN_KEY);
  },
  setReturnUrl(url: string | null) {
    useAuthStore.setState({ returnUrl: url });
  },
  getReturnUrl(): string | null {
    return useAuthStore.getState().returnUrl;
  },
};
```

- [ ] **Step 2: Commit**

```bash
cd /Users/augustos/dev/lakitu && git add apps/web/src/modules/auth/auth.store.ts && git commit -m "$(cat <<'EOF'
feat(auth): add returnUrl to auth store for post-login redirect
EOF
)"
```

---

### Task 10: Export Router Instance

**Files:**

- Modify: `apps/web/src/main.tsx`

The machine's `authenticated` final state needs to call `router.navigate()` to redirect to the dashboard. The router instance must be exported from `main.tsx` so the machine can import it.

- [ ] **Step 1: Export the router**

In `apps/web/src/main.tsx`, add `export` to the `router` const:

Change:

```typescript
const router = createRouter({ routeTree, context: { queryClient } });
```

To:

```typescript
export const router = createRouter({ routeTree, context: { queryClient } });
```

- [ ] **Step 2: Verify typecheck**

```bash
cd /Users/augustos/dev/lakitu && bun --filter web typecheck
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
cd /Users/augustos/dev/lakitu && git add apps/web/src/main.tsx && git commit -m "$(cat <<'EOF'
feat(web): export router instance for programmatic navigation
EOF
)"
```

---

### Task 11: XState Auth Setup Machine

**Files:**

- Create: `apps/web/src/modules/auth/auth-setup.machine.ts`

This is the core of the feature. The machine governs the entire auth + onboarding flow.

**Important XState v5 notes for the dev agent:**

- XState v5 uses `setup({...}).createMachine({...})` syntax, NOT v4's `createMachine({...})`.
- Invoked services are `fromPromise(async ({ input }) => ...)` actors.
- Guards, actions, and actors are declared in `setup({ guards, actions, actors })`.
- Context typing uses `types: {} as { context: AuthSetupContext; events: AuthSetupEvent }` in `setup()`.
- `assign()` takes a function `({ context, event }) => ({ ...partialContext })`.
- State transitions use `on: { EVENT: { target: 'state', actions: [...] } }`.
- Invoked services use `invoke: { src: 'actorName', input: ({ context }) => ..., onDone: { target: 'state', actions: [...] }, onError: { ... } }`.

- [ ] **Step 1: Create the machine file**

Create `apps/web/src/modules/auth/auth-setup.machine.ts`:

```typescript
import { assign, fromPromise, setup } from 'xstate';

import type { User } from '@lakitu/api/auth';
import type { OnboardingStatus } from '@lakitu/api/onboarding';

import { router } from '@/main';
import { authActions } from '@/modules/auth/auth.store';

import {
  createCompany,
  fetchOnboardingStatus,
  fetchProfile,
  joinCompany,
  sendChallenge,
  startVeryAiLink,
  verifyOtp,
} from './auth-setup.api';
import { isTokenExpired } from './lib/jwt-decode';
import type { AuthScreen, AuthSetupContext, AuthSetupEvent } from './auth-setup.types';

function resolveNextScreen(status: OnboardingStatus): AuthScreen {
  if (status.onboarded) return 'success';
  switch (status.next_step) {
    case 'company':
      return 'company';
    case 'very_ai_link':
    case 'very_ai_verify':
    case 'very_ai_reverify':
      return 'very-ai';
    default:
      return 'success';
  }
}

function resolveNextState(status: OnboardingStatus): string {
  if (status.onboarded) return 'success';
  switch (status.next_step) {
    case 'company':
      return 'company';
    case 'very_ai_link':
    case 'very_ai_verify':
    case 'very_ai_reverify':
      return 'veryAi';
    default:
      return 'success';
  }
}

interface ResolvePositionResult {
  token: string;
  user: User;
  onboardingStatus: OnboardingStatus;
}

export const authSetupMachine = setup({
  types: {} as {
    context: AuthSetupContext;
    events: AuthSetupEvent;
  },
  actors: {
    resolvePosition: fromPromise(async (): Promise<ResolvePositionResult | null> => {
      const token = authActions.getToken();
      if (!token || isTokenExpired(token)) return null;

      authActions.hydrate();
      const user = await fetchProfile();
      const onboardingStatus = await fetchOnboardingStatus();
      return { token, user, onboardingStatus };
    }),

    sendChallenge: fromPromise(async ({ input }: { input: { email: string } }) => {
      const result = await sendChallenge(input.email);
      return { challengeId: result.challenge_id };
    }),

    verifyOtp: fromPromise(async ({ input }: { input: { email: string; code: string } }) => {
      const result = await verifyOtp(input.email, input.code);
      return { token: result.token, user: result.user };
    }),

    checkOnboardingStatus: fromPromise(async () => {
      return fetchOnboardingStatus();
    }),

    createCompanyActor: fromPromise(async ({ input }: { input: { name: string } }) => {
      await createCompany(input.name);
    }),

    joinCompanyActor: fromPromise(async ({ input }: { input: { companyId: string } }) => {
      await joinCompany(input.companyId);
    }),

    startVeryAiLinkActor: fromPromise(async () => {
      const result = await startVeryAiLink();
      return { authorizeUrl: result.authorize_url };
    }),
  },
  guards: {
    hasValidPosition: (_, params: { result: ResolvePositionResult | null }) => {
      return params.result !== null;
    },
    canRetry: ({ context }) => context.retryCount < 3,
  },
  actions: {
    writeToAuthStore: ({ context }) => {
      if (context.user && context.token) {
        authActions.login(context.user, context.token);
      }
    },
    navigateToDashboard: () => {
      const returnUrl = authActions.getReturnUrl();
      authActions.setReturnUrl(null);
      router.navigate({ to: returnUrl ?? '/dashboard' });
    },
    clearAuth: () => {
      authActions.logout();
    },
    redirectToVeryAi: (_, params: { authorizeUrl: string }) => {
      window.location.href = params.authorizeUrl;
    },
  },
}).createMachine({
  id: 'authSetup',
  initial: 'verification',
  context: {
    screen: 'loading',
    email: '',
    challengeId: null,
    token: null,
    user: null,
    onboardingStatus: null,
    error: null,
    retryCount: 0,
  },

  on: {
    LOGOUT: {
      target: '.email',
      actions: [
        'clearAuth',
        assign({
          screen: 'email' as const,
          token: null,
          user: null,
          onboardingStatus: null,
          email: '',
          challengeId: null,
          error: null,
        }),
      ],
    },
  },

  states: {
    verification: {
      entry: assign({ screen: 'loading' as const }),
      invoke: {
        src: 'resolvePosition',
        onDone: [
          {
            guard: ({ event }) => event.output !== null && event.output.onboardingStatus.onboarded,
            target: 'success',
            actions: assign(({ event }) => ({
              token: event.output!.token,
              user: event.output!.user,
              onboardingStatus: event.output!.onboardingStatus,
              screen: 'success' as const,
            })),
          },
          {
            guard: ({ event }) =>
              event.output !== null && event.output.onboardingStatus.next_step === 'company',
            target: 'company',
            actions: assign(({ event }) => ({
              token: event.output!.token,
              user: event.output!.user,
              onboardingStatus: event.output!.onboardingStatus,
              screen: 'company' as const,
            })),
          },
          {
            guard: ({ event }) => {
              if (!event.output) return false;
              const step = event.output.onboardingStatus.next_step;
              return (
                step === 'very_ai_link' || step === 'very_ai_verify' || step === 'very_ai_reverify'
              );
            },
            target: 'veryAi',
            actions: assign(({ event }) => ({
              token: event.output!.token,
              user: event.output!.user,
              onboardingStatus: event.output!.onboardingStatus,
              screen: 'very-ai' as const,
            })),
          },
          {
            target: 'email',
            actions: assign({ screen: 'email' as const }),
          },
        ],
        onError: {
          target: 'email',
          actions: assign({ screen: 'email' as const }),
        },
      },
    },

    email: {
      entry: assign({ screen: 'email' as const }),
      initial: 'idle',
      states: {
        idle: {
          on: {
            SUBMIT_EMAIL: {
              target: 'submitting',
              actions: assign(({ event }) => ({ email: event.email })),
            },
          },
        },
        submitting: {
          invoke: {
            src: 'sendChallenge',
            input: ({ context }) => ({ email: context.email }),
            onDone: {
              target: 'done',
              actions: assign(({ event }) => ({
                challengeId: event.output.challengeId,
              })),
            },
            onError: {
              target: 'idle',
              actions: assign(({ event }) => ({
                error: { message: (event.error as Error).message ?? 'Failed to send code' },
              })),
            },
          },
        },
        done: { type: 'final' as const },
      },
      onDone: { target: 'otp' },
    },

    otp: {
      entry: assign({ screen: 'otp' as const, error: null }),
      initial: 'idle',
      states: {
        idle: {
          on: {
            SUBMIT_OTP: 'submitting',
            BACK_TO_EMAIL: {
              target: '#authSetup.email',
              actions: assign({ challengeId: null, error: null }),
            },
          },
        },
        submitting: {
          invoke: {
            src: 'verifyOtp',
            input: ({ context, event }) => ({
              email: context.email,
              code: (event as { type: 'SUBMIT_OTP'; code: string }).code,
            }),
            onDone: {
              target: 'checkingStatus',
              actions: assign(({ event }) => ({
                token: event.output.token,
                user: event.output.user,
              })),
            },
            onError: {
              target: 'idle',
              actions: assign(({ event }) => ({
                error: { message: (event.error as Error).message ?? 'Invalid code' },
              })),
            },
          },
        },
        checkingStatus: {
          entry: ({ context }) => {
            if (context.token) {
              authActions.login(context.user!, context.token);
            }
          },
          invoke: {
            src: 'checkOnboardingStatus',
            onDone: {
              target: 'done',
              actions: assign(({ event }) => ({
                onboardingStatus: event.output,
              })),
            },
            onError: {
              target: '#authSetup.error',
              actions: assign(({ event }) => ({
                error: {
                  message: (event.error as Error).message ?? 'Failed to check onboarding status',
                },
              })),
            },
          },
        },
        done: { type: 'final' as const },
      },
      onDone: [
        {
          guard: ({ context }) => context.onboardingStatus?.onboarded === true,
          target: 'success',
        },
        {
          guard: ({ context }) => context.onboardingStatus?.next_step === 'company',
          target: 'company',
        },
        {
          guard: ({ context }) => {
            const step = context.onboardingStatus?.next_step;
            return (
              step === 'very_ai_link' || step === 'very_ai_verify' || step === 'very_ai_reverify'
            );
          },
          target: 'veryAi',
        },
        { target: 'success' },
      ],
    },

    company: {
      entry: assign({ screen: 'company' as const, error: null }),
      initial: 'idle',
      states: {
        idle: {
          on: {
            CREATE_COMPANY: 'creating',
            JOIN_COMPANY: 'joining',
          },
        },
        creating: {
          invoke: {
            src: 'createCompanyActor',
            input: ({ event }) => ({
              name: (event as { type: 'CREATE_COMPANY'; name: string }).name,
            }),
            onDone: 'checkingStatus',
            onError: {
              target: 'idle',
              actions: assign(({ event }) => ({
                error: { message: (event.error as Error).message ?? 'Failed to create company' },
              })),
            },
          },
        },
        joining: {
          invoke: {
            src: 'joinCompanyActor',
            input: ({ event }) => ({
              companyId: (event as { type: 'JOIN_COMPANY'; companyId: string }).companyId,
            }),
            onDone: 'checkingStatus',
            onError: {
              target: 'idle',
              actions: assign(({ event }) => ({
                error: { message: (event.error as Error).message ?? 'Failed to join company' },
              })),
            },
          },
        },
        checkingStatus: {
          invoke: {
            src: 'checkOnboardingStatus',
            onDone: {
              target: 'done',
              actions: assign(({ event }) => ({
                onboardingStatus: event.output,
              })),
            },
            onError: {
              target: '#authSetup.error',
              actions: assign(({ event }) => ({
                error: { message: (event.error as Error).message ?? 'Failed to check status' },
              })),
            },
          },
        },
        done: { type: 'final' as const },
      },
      onDone: [
        {
          guard: ({ context }) => {
            const step = context.onboardingStatus?.next_step;
            return (
              step === 'very_ai_link' || step === 'very_ai_verify' || step === 'very_ai_reverify'
            );
          },
          target: 'veryAi',
        },
        { target: 'success' },
      ],
    },

    veryAi: {
      entry: assign({ screen: 'very-ai' as const, error: null }),
      invoke: {
        src: 'startVeryAiLinkActor',
        onDone: {
          actions: ({ event }) => {
            window.location.href = event.output.authorizeUrl;
          },
        },
        onError: {
          target: 'error',
          actions: assign(({ event }) => ({
            error: { message: (event.error as Error).message ?? 'Failed to start VeryAI link' },
          })),
        },
      },
    },

    success: {
      entry: assign({ screen: 'success' as const }),
      after: {
        1500: 'authenticated',
      },
    },

    authenticated: {
      type: 'final',
      entry: ['writeToAuthStore', 'navigateToDashboard'],
    },

    error: {
      entry: assign(({ context }) => ({
        screen: 'error' as const,
        retryCount: context.retryCount + 1,
      })),
      on: {
        RETRY: {
          guard: 'canRetry',
          target: 'verification',
          actions: assign({ error: null }),
        },
      },
    },
  },
});
```

**Critical note for the dev agent:** The `input` property in invoke config for compound states needs careful handling. In XState v5, when a compound state transitions to a child state via an event, the event is available in the child's invoke `input`. But if you use `({ event })` in the input function, the event is the one that triggered the transition to that child state. For the `otp.submitting` and `company.creating/joining` states, the event carries the form data. This is correct but the dev agent must verify it works by checking the XState v5 docs if the type narrows correctly.

Also note: the BACK_TO_EMAIL event in the otp.idle state uses `#authSetup.email` to reference the top-level email state. This is XState v5 ID-based targeting.

The LOGOUT event is on the root `on` handler so it works from any state.

- [ ] **Step 2: Run typecheck**

```bash
cd /Users/augustos/dev/lakitu && bun --filter web typecheck
```

Expected: no type errors. There may be warnings about unused types -- fix as needed.

**If there are XState v5 API mismatches:** The dev agent should consult the XState v5 documentation. Key differences from v4:

- `setup()` is required
- `type: 'final'` in nested states is just `{ type: 'final' }`
- Guards in `onDone` transitions use `({ context, event })` syntax
- The `fromPromise` actor input function receives `{ input }` where `input` is what the invoke config's `input` function returned

- [ ] **Step 3: Commit**

```bash
cd /Users/augustos/dev/lakitu && git add apps/web/src/modules/auth/auth-setup.machine.ts && git commit -m "$(cat <<'EOF'
feat(auth): implement XState v5 auth-setup state machine
EOF
)"
```

---

### Task 12: Auth Setup CSS

**Files:**

- Create: `apps/web/src/modules/auth/auth-setup.css`

Custom CSS for the split-screen layout, brand panel sky gradient, clouds, OTP animations, and other visual details from the design that cannot be achieved with utility classes alone. The design reference is at `design/lakitu/styles.css`.

- [ ] **Step 1: Create the CSS file**

Create `apps/web/src/modules/auth/auth-setup.css`. Port the relevant CSS from `design/lakitu/styles.css`:

- The `.page` grid layout (`grid-template-columns: 1.15fr 1fr`)
- The `.brand` panel styles (sky gradient, positioning)
- Cloud positioning
- Mascot frame and halo
- Checkered stripe
- OTP cell styles (`.filled`, `.locked`, shake animation)
- Success animation (pop, loader-bar, slide)
- Flag wave animation
- Responsive breakpoint at 960px

Use Tailwind v4 `@theme` variables where they match (e.g., use `var(--color-foreground)` instead of hardcoded `#0e1726` where the semantics match). For brand-panel-specific colors (sky gradient blues, cloud whites), use the design's CSS custom properties directly since they are specific to the auth layout and do not belong in the global theme.

The dev agent should import this CSS file from the auth layout component:

```typescript
import './auth-setup.css';
```

This is intentionally not in the global stylesheet -- it is scoped to the auth flow.

- [ ] **Step 2: Commit**

```bash
cd /Users/augustos/dev/lakitu && git add apps/web/src/modules/auth/auth-setup.css && git commit -m "$(cat <<'EOF'
feat(auth): add auth-setup layout and animation CSS
EOF
)"
```

---

### Task 13: Brand Panel Components (Cloud, LakituLogo, CheckeredStripe)

**Files:**

- Create: `apps/web/src/modules/auth/components/cloud.tsx`
- Create: `apps/web/src/modules/auth/components/lakitu-logo.tsx`
- Create: `apps/web/src/modules/auth/components/checkered-stripe.tsx`

These are pure presentational SVG components ported from `design/lakitu/app.jsx`. They have no state, no props beyond styling. Keep them small and focused.

- [ ] **Step 1: Create Cloud component**

Create `apps/web/src/modules/auth/components/cloud.tsx`:

Port the `Cloud` component from `design/lakitu/app.jsx` (lines 33-55). It takes `style`, `scale`, and `opacity` props and renders an SVG cloud with ellipses. Use `React.CSSProperties` for the style prop type. Use `aria-hidden="true"` on the SVG.

- [ ] **Step 2: Create LakituLogo component**

Create `apps/web/src/modules/auth/components/lakitu-logo.tsx`:

Port the `LakituLogo` component from `design/lakitu/app.jsx` (lines 57-84). Takes a `size` prop (default 36). Renders the logo SVG with gradient and cloud/flag elements.

- [ ] **Step 3: Create CheckeredStripe component**

Create `apps/web/src/modules/auth/components/checkered-stripe.tsx`:

Port the `CheckeredStripe` component from `design/lakitu/app.jsx` (lines 3-30). Takes `rows`, `cols`, `cell` props with defaults `2, 28, 22`. Renders an SVG grid of alternating dark/white squares.

- [ ] **Step 4: Commit**

```bash
cd /Users/augustos/dev/lakitu && git add apps/web/src/modules/auth/components/cloud.tsx apps/web/src/modules/auth/components/lakitu-logo.tsx apps/web/src/modules/auth/components/checkered-stripe.tsx && git commit -m "$(cat <<'EOF'
feat(auth): add Cloud, LakituLogo, and CheckeredStripe SVG components
EOF
)"
```

---

### Task 14: Brand Panel Component

**Files:**

- Create: `apps/web/src/modules/auth/components/brand-panel.tsx`

Port the `BrandPanel` from `design/lakitu/app.jsx` (lines 86-151). This is the left side of the split-screen layout.

- [ ] **Step 1: Create the BrandPanel component**

Create `apps/web/src/modules/auth/components/brand-panel.tsx`:

Structure:

- Outer div with class `brand` (from auth-setup.css)
- `brand-sky` div (gradient background)
- 4x `Cloud` instances at different positions/scales
- `brand-top` header: `LakituLogo` + "Lakitu" wordmark + "Agent control tower" pill
- `brand-stage` center: mascot image frame with halo, checkered flag SVG, and brand copy ("Start the match. Validate every agent.")
- `brand-flag-stripe` bottom: `CheckeredStripe`
- The mascot image uses `<img src="/lakitu-world.png" alt="Lakitu mascot" />` (from `apps/web/public/lakitu-world.png` copied in Task 4)
- Remove the `<image-slot>` element from the design -- that was a design tool artifact. Replace it with the actual `<img>` tag.

Use `font-display` for headings (maps to Bricolage Grotesque via the CSS variable from Task 3).

- [ ] **Step 2: Commit**

```bash
cd /Users/augustos/dev/lakitu && git add apps/web/src/modules/auth/components/brand-panel.tsx && git commit -m "$(cat <<'EOF'
feat(auth): add BrandPanel component with sky gradient and mascot
EOF
)"
```

---

### Task 15: Step Indicator Component

**Files:**

- Create: `apps/web/src/modules/auth/components/step-indicator.tsx`

The step indicator shows which step the user is on. The design shows a pill with numbered dots and connecting lines. For the full auth+onboarding flow, there are 4 possible steps: Email (1), OTP (2), Company (3), VeryAI (4). But some users may skip steps (e.g., if already onboarded). The indicator should show 2 steps for the auth-only flow (email + otp) and extend to show onboarding steps when present.

However, since the machine determines the flow, the simplest approach is: the step indicator takes a `currentStep` number and `totalSteps` number and renders accordingly. The form panel derives these from the machine's `screen` property.

- [ ] **Step 1: Create StepIndicator component**

Create `apps/web/src/modules/auth/components/step-indicator.tsx`:

Props: `currentStep: number`, `totalSteps: number`.

Renders a horizontal row of numbered circles connected by lines. The current step's circle is filled (dark background, white text). Previous steps show a checkmark or are also filled. Future steps are outlined.

Use the design's CSS classes: `.step-pill`, `.step`, `.step.on`, `.step.done`, `.step-line` from `design/lakitu/styles.css` (lines 233-268).

Port the styling to Tailwind utility classes or reference the auth-setup.css classes.

- [ ] **Step 2: Commit**

```bash
cd /Users/augustos/dev/lakitu && git add apps/web/src/modules/auth/components/step-indicator.tsx && git commit -m "$(cat <<'EOF'
feat(auth): add StepIndicator component for multi-step progress
EOF
)"
```

---

### Task 16: Email Screen Component

**Files:**

- Create: `apps/web/src/modules/auth/components/email-screen.tsx`

The email input form. Uses react-hook-form with the `emailSchema` from Task 7. On submit, sends `SUBMIT_EMAIL` to the machine.

- [ ] **Step 1: Create EmailScreen component**

Create `apps/web/src/modules/auth/components/email-screen.tsx`:

Props: `onSubmit: (email: string) => void`, `isSubmitting: boolean`, `error: string | null`.

Structure:

- `<form>` with `onSubmit` from react-hook-form
- `<Label>` for "Work email"
- `<Input>` with type="email", autoFocus, autoComplete="email", placeholder "you@company.com"
- Error display below input (from form errors OR from machine error prop)
- `<Button>` submit: "Send one-time code" with an arrow SVG icon (from design)
- No Google SSO or SAML buttons (out of scope per requirements)

The component uses `useForm<EmailFormValues>` with `zodResolver(emailSchema)`.

The `isSubmitting` prop disables the button and shows a spinner. The `error` prop shows the API error returned from the machine (e.g., "Rate limited").

Use shadcn `Input`, `Label`, and `Button` components from `@repo/ui/shadcn/*`.

- [ ] **Step 2: Commit**

```bash
cd /Users/augustos/dev/lakitu && git add apps/web/src/modules/auth/components/email-screen.tsx && git commit -m "$(cat <<'EOF'
feat(auth): add EmailScreen component with email form
EOF
)"
```

---

### Task 17: OTP Screen Component

**Files:**

- Create: `apps/web/src/modules/auth/components/otp-screen.tsx`

The OTP verification form. Uses shadcn InputOTP. On complete (6 digits entered), auto-submits by sending `SUBMIT_OTP` to the machine. Includes resend timer, back button, shake animation on error.

- [ ] **Step 1: Create OtpScreen component**

Create `apps/web/src/modules/auth/components/otp-screen.tsx`:

Props: `email: string`, `onSubmit: (code: string) => void`, `onBack: () => void`, `onResend: () => void`, `isSubmitting: boolean`, `error: string | null`.

Structure:

- Back button ("Use a different email") at top, calls `onBack`
- Meta text: "Enter the 6-digit code" + "Sent to **{email}**"
- `InputOTP` with `maxLength={6}`, `pattern={REGEXP_ONLY_DIGITS}` from `input-otp`
  - Render 6 `InputOTPSlot` components inside `InputOTPGroup`
  - Use `onComplete` callback to auto-submit when 6 digits are entered
- Resend timer: countdown from 30s. When 0, show "Resend code" button that calls `onResend`
- Dev hint: "Hint: `111111`" (shown only when `webEnv.app.isDevelopment`)
- Shake animation: when `error` transitions from null to a value, apply shake class to the OTP row, then clear after 400ms
- Verifying state: when `isSubmitting`, show spinner + "Verifying code..."

Use `useForm<OtpFormValues>` with `zodResolver(otpSchema)` for the form, but the actual input is the shadcn InputOTP component. The form is primarily for validation gating. On `onComplete` from InputOTP, call `form.setValue('code', value)` then `form.handleSubmit(onValid)()`.

Import `webEnv` from `@/modules/core/lib/env` for the dev hint conditional.

- [ ] **Step 2: Commit**

```bash
cd /Users/augustos/dev/lakitu && git add apps/web/src/modules/auth/components/otp-screen.tsx && git commit -m "$(cat <<'EOF'
feat(auth): add OtpScreen component with auto-submit and shake animation
EOF
)"
```

---

### Task 18: Company Screen Component

**Files:**

- Create: `apps/web/src/modules/auth/components/company-screen.tsx`

The company step. Two modes: "Create a company" (form with company name input) and "Join a company" (search existing companies, select one). Toggle between modes with a link.

- [ ] **Step 1: Create CompanyScreen component**

Create `apps/web/src/modules/auth/components/company-screen.tsx`:

Props: `onCreateCompany: (name: string) => void`, `onJoinCompany: (companyId: string) => void`, `isSubmitting: boolean`, `error: string | null`.

Structure:

- Mode toggle: "Create a new company" / "Join an existing company" link to switch modes
- **Create mode:**
  - `useForm<CreateCompanyFormValues>` with `zodResolver(createCompanySchema)`
  - `<Label>` "Company name"
  - `<Input>` for company name, placeholder "Acme Corp"
  - `<Button>` "Create company"
- **Join mode:**
  - Search input with debounced `searchCompanies` API call (use a `useState` + `useEffect` with 300ms debounce -- not react-query, keep it simple)
  - List of matching companies below the search input
  - Each company row is a `<button>` that calls `onJoinCompany(company.id)`
  - Show "No companies found" when search returns empty
  - Show "Type to search..." when search is empty

Import `searchCompanies` from `@/modules/auth/auth-setup.api` for the search functionality.

Error display: show `error` prop below the form/search area.

- [ ] **Step 2: Commit**

```bash
cd /Users/augustos/dev/lakitu && git add apps/web/src/modules/auth/components/company-screen.tsx && git commit -m "$(cat <<'EOF'
feat(auth): add CompanyScreen with create and join company modes
EOF
)"
```

---

### Task 19: VeryAI Screen Component

**Files:**

- Create: `apps/web/src/modules/auth/components/very-ai-screen.tsx`

The VeryAI step. This screen shows while the machine fetches the authorize URL and then redirects. It is mostly a loading/redirect state.

- [ ] **Step 1: Create VeryAiScreen component**

Create `apps/web/src/modules/auth/components/very-ai-screen.tsx`:

Props: none (this is a passive screen -- the machine handles the redirect).

Structure:

- Centered content
- Spinner
- Text: "Redirecting to VeryAI..."
- Subtext: "You'll be taken to VeryAI to verify your identity. Once complete, you'll return here automatically."

This is a simple presentational component. The machine's `veryAi` state entry invoke handles the API call and redirect.

- [ ] **Step 2: Commit**

```bash
cd /Users/augustos/dev/lakitu && git add apps/web/src/modules/auth/components/very-ai-screen.tsx && git commit -m "$(cat <<'EOF'
feat(auth): add VeryAiScreen redirect loading component
EOF
)"
```

---

### Task 20: Success and Error Screen Components

**Files:**

- Create: `apps/web/src/modules/auth/components/success-screen.tsx`
- Create: `apps/web/src/modules/auth/components/error-screen.tsx`

- [ ] **Step 1: Create SuccessScreen component**

Create `apps/web/src/modules/auth/components/success-screen.tsx`:

Props: `email: string`.

Port the `SuccessStep` from `design/lakitu/app.jsx` (lines 366-389):

- Centered layout
- Success badge (animated checkmark circle with pop animation)
- "Green flag." heading
- "Welcome back. Routing **{email}** to the control tower..." subtext
- Loader bar with sliding fill animation

All animations are CSS-driven (from auth-setup.css).

- [ ] **Step 2: Create ErrorScreen component**

Create `apps/web/src/modules/auth/components/error-screen.tsx`:

Props: `message: string`, `onRetry: (() => void) | null` (null when retry limit reached).

Structure:

- Error icon (red circle with X)
- "Something went wrong" heading
- Error message text
- Retry button (if `onRetry` is not null): "Try again"
- If `onRetry` is null: "Please refresh the page and try again." text

- [ ] **Step 3: Commit**

```bash
cd /Users/augustos/dev/lakitu && git add apps/web/src/modules/auth/components/success-screen.tsx apps/web/src/modules/auth/components/error-screen.tsx && git commit -m "$(cat <<'EOF'
feat(auth): add SuccessScreen and ErrorScreen components
EOF
)"
```

---

### Task 21: Form Panel Component

**Files:**

- Create: `apps/web/src/modules/auth/components/form-panel.tsx`

The right side of the split-screen. Contains the step indicator, title, subtitle, screen slot (where step components render), and footer. Derives title/subtitle from the current `screen` value.

- [ ] **Step 1: Create FormPanel component**

Create `apps/web/src/modules/auth/components/form-panel.tsx`:

Props: `screen: AuthScreen`, `children: React.ReactNode`.

Structure:

- Outer div with class `login-panel` (from auth-setup.css)
  - Dot-grid background pseudo-element (from CSS)
- Inner div with class `login-inner` (max-width 420px, flex column)
  - `<header>`: `StepIndicator` + title `<h2>` + subtitle `<p>`
  - Step stage div: `{children}` (the screen component slot)
  - `<footer>`: copyright, Privacy, Terms, Status links

Title/subtitle derivation from `screen`:

- `loading`: "Setting up..." / "Checking your session..."
- `email`: "Sign in to Lakitu" / "Use your work email. We'll send a single-use code -- no password to forget."
- `otp`: "Check your inbox" / "Codes expire in 10 minutes. Keep this tab open while you fetch it."
- `company`: "Set up your company" / "Create a new company or join an existing one."
- `very-ai`: "Verify with VeryAI" / "We need to verify your identity to continue."
- `success`: "You're in" / "Hang tight while we set up your session."
- `error`: "Something went wrong" / "We hit a snag. You can retry or start over."

Step indicator logic:

- For `email`/`otp`: step 1 of 2 (email) or 2 of 2 (otp). Don't show onboarding steps yet.
- For `company`: step 1 of N (where N depends on whether VeryAI is needed -- but the machine doesn't expose this to the component easily). Simpler: just show "Step 3" without a total, or show step 1 of 2 for onboarding steps.
- Simplest: for auth steps (email, otp) show 2-step indicator. For onboarding steps (company, very-ai) show a separate indicator. For loading/success/error, hide the indicator.

- [ ] **Step 2: Commit**

```bash
cd /Users/augustos/dev/lakitu && git add apps/web/src/modules/auth/components/form-panel.tsx && git commit -m "$(cat <<'EOF'
feat(auth): add FormPanel component with step indicator and screen slot
EOF
)"
```

---

### Task 22: Auth Layout Component

**Files:**

- Create: `apps/web/src/modules/auth/components/auth-layout.tsx`

The split-screen container that holds BrandPanel (left) and FormPanel (right).

- [ ] **Step 1: Create AuthLayout component**

Create `apps/web/src/modules/auth/components/auth-layout.tsx`:

```typescript
import '../auth-setup.css';

import { BrandPanel } from './brand-panel';
import { FormPanel } from './form-panel';
import type { AuthScreen } from '../auth-setup.types';

interface AuthLayoutProps {
  screen: AuthScreen;
  children: React.ReactNode;
}

export function AuthLayout({ screen, children }: AuthLayoutProps) {
  return (
    <div className="page">
      <BrandPanel />
      <FormPanel screen={screen}>{children}</FormPanel>
    </div>
  );
}
```

The CSS import pulls in the auth-setup.css which defines the `.page` grid and brand panel styles.

- [ ] **Step 2: Commit**

```bash
cd /Users/augustos/dev/lakitu && git add apps/web/src/modules/auth/components/auth-layout.tsx && git commit -m "$(cat <<'EOF'
feat(auth): add AuthLayout split-screen container component
EOF
)"
```

---

### Task 23: Login Route -- Wire Everything Together

**Files:**

- Modify: `apps/web/src/routes/login.tsx`

Replace the placeholder with the full machine-driven auth UI.

- [ ] **Step 1: Rewrite the login route**

Replace the entire contents of `apps/web/src/routes/login.tsx`:

```typescript
import { createFileRoute, redirect } from '@tanstack/react-router';
import { useMachine, useSelector } from '@xstate/react';
import { Toaster } from '@repo/ui/shadcn/sonner';

import { authActions } from '@/modules/auth/auth.store';
import { authSetupMachine } from '@/modules/auth/auth-setup.machine';
import { AuthLayout } from '@/modules/auth/components/auth-layout';
import { EmailScreen } from '@/modules/auth/components/email-screen';
import { OtpScreen } from '@/modules/auth/components/otp-screen';
import { CompanyScreen } from '@/modules/auth/components/company-screen';
import { VeryAiScreen } from '@/modules/auth/components/very-ai-screen';
import { SuccessScreen } from '@/modules/auth/components/success-screen';
import { ErrorScreen } from '@/modules/auth/components/error-screen';
import type { AuthScreen } from '@/modules/auth/auth-setup.types';

export const Route = createFileRoute('/login')({
  beforeLoad: async () => {
    // If already authenticated and onboarded, skip login
    // This is a fast-path -- the machine also handles this via verification state
    // but this prevents a flash of the login UI
  },
  component: LoginPage,
});

function LoginPage() {
  const [state, send] = useMachine(authSetupMachine);
  const screen = state.context.screen;
  const email = state.context.email;
  const error = state.context.error;
  const isSubmitting =
    state.matches('email.submitting') ||
    state.matches('otp.submitting') ||
    state.matches('company.creating') ||
    state.matches('company.joining');

  return (
    <>
      <Toaster position="top-right" />
      <AuthLayout screen={screen}>
        <LoginScreen
          screen={screen}
          email={email}
          error={error}
          isSubmitting={isSubmitting}
          send={send}
        />
      </AuthLayout>
      {screen !== 'email' && screen !== 'loading' && (
        <button
          className="absolute right-6 top-6 text-sm text-muted-foreground hover:text-foreground"
          onClick={() => send({ type: 'LOGOUT' })}
          data-testid="logout-button"
        >
          Sign out
        </button>
      )}
    </>
  );
}

interface LoginScreenProps {
  screen: AuthScreen;
  email: string;
  error: { message: string; code?: string } | null;
  isSubmitting: boolean;
  send: (event: any) => void;
}

function LoginScreen({ screen, email, error, isSubmitting, send }: LoginScreenProps) {
  switch (screen) {
    case 'loading':
      return (
        <div className="flex items-center justify-center py-12" data-testid="auth-loading">
          <div className="spinner" />
        </div>
      );
    case 'email':
      return (
        <EmailScreen
          onSubmit={(e) => send({ type: 'SUBMIT_EMAIL', email: e })}
          isSubmitting={isSubmitting}
          error={error?.message ?? null}
        />
      );
    case 'otp':
      return (
        <OtpScreen
          email={email}
          onSubmit={(code) => send({ type: 'SUBMIT_OTP', code })}
          onBack={() => send({ type: 'BACK_TO_EMAIL' })}
          onResend={() => send({ type: 'SUBMIT_EMAIL', email })}
          isSubmitting={isSubmitting}
          error={error?.message ?? null}
        />
      );
    case 'company':
      return (
        <CompanyScreen
          onCreateCompany={(name) => send({ type: 'CREATE_COMPANY', name })}
          onJoinCompany={(companyId) => send({ type: 'JOIN_COMPANY', companyId })}
          isSubmitting={isSubmitting}
          error={error?.message ?? null}
        />
      );
    case 'very-ai':
      return <VeryAiScreen />;
    case 'success':
      return <SuccessScreen email={email} />;
    case 'error':
      return (
        <ErrorScreen
          message={error?.message ?? 'Something went wrong'}
          onRetry={state.context.retryCount < 3 ? () => send({ type: 'RETRY' }) : null}
        />
      );
    default:
      return null;
  }
}
```

**Note for the dev agent:** The `LoginScreen` function references `state.context.retryCount` but it only receives `error` as a prop. Fix this by either:

1. Passing `retryCount` as a prop, or
2. Moving the retry check into the `ErrorScreen` component, or
3. Using `useSelector` to read the context directly from the actor.

The cleanest approach: pass `canRetry: boolean` as a prop to `LoginScreen`, computed from `state.context.retryCount < 3` in `LoginPage`.

Also note: the `send` prop is typed as `(event: any) => void`. The dev agent should type this properly using XState's `EventFrom` type helper or by defining the send function type based on `AuthSetupEvent`.

- [ ] **Step 2: Run typecheck**

```bash
cd /Users/augustos/dev/lakitu && bun --filter web typecheck
```

Expected: no errors. Fix any type issues.

- [ ] **Step 3: Commit**

```bash
cd /Users/augustos/dev/lakitu && git add apps/web/src/routes/login.tsx && git commit -m "$(cat <<'EOF'
feat(auth): wire login route to XState auth-setup machine
EOF
)"
```

---

### Task 24: Update Authenticated Layout Guard

**Files:**

- Modify: `apps/web/src/routes/_authenticated.tsx`

Update the guard to set `returnUrl` before redirecting to `/login`.

- [ ] **Step 1: Update the guard**

Modify `apps/web/src/routes/_authenticated.tsx`:

Add `authActions.setReturnUrl(...)` before the redirect to `/login`. The returnUrl should be the current location path.

```typescript
import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';

import type { OnboardingStatus } from '@lakitu/api/onboarding';

import { apiCall, ApiResponseError, lakituAuthApi } from '@/api';
import { authActions } from '@/modules/auth/auth.store';

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: async ({ location }) => {
    const token = authActions.getToken();

    if (!token) {
      authActions.setReturnUrl(location.pathname);
      throw redirect({ to: '/login' });
    }

    let status: OnboardingStatus;

    try {
      status = await apiCall<OnboardingStatus>(() => lakituAuthApi.onboarding.status.get());
    } catch (error: unknown) {
      if (error instanceof ApiResponseError && error.status === 401) {
        authActions.logout();
        authActions.setReturnUrl(location.pathname);
        throw redirect({ to: '/login' });
      }

      throw error;
    }

    if (!status.onboarded) {
      authActions.setReturnUrl(location.pathname);
      throw redirect({ to: '/login' });
    }

    return { onboardingStatus: status };
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  return <Outlet />;
}
```

Key changes from the existing file:

1. Added `{ location }` to `beforeLoad` params to access current path.
2. Replaced the `mapNextStepToRoute` redirect to `/onboarding/$step` with a redirect to `/login` (since onboarding is now handled within `/login`).
3. Added `authActions.setReturnUrl(location.pathname)` before each redirect.

- [ ] **Step 2: Commit**

```bash
cd /Users/augustos/dev/lakitu && git add apps/web/src/routes/_authenticated.tsx && git commit -m "$(cat <<'EOF'
feat(auth): update authenticated guard to set returnUrl and redirect to /login
EOF
)"
```

---

### Task 25: Delete Onboarding Routes and Utils

**Files:**

- Delete: `apps/web/src/routes/onboarding/route.tsx`
- Delete: `apps/web/src/routes/onboarding/$step.tsx`
- Delete: `apps/web/src/modules/onboarding/onboarding.utils.ts`

These files are replaced by the auth-setup machine which handles onboarding steps within the `/login` route.

- [ ] **Step 1: Delete the files**

```bash
rm /Users/augustos/dev/lakitu/apps/web/src/routes/onboarding/route.tsx
rm /Users/augustos/dev/lakitu/apps/web/src/routes/onboarding/\$step.tsx
rm /Users/augustos/dev/lakitu/apps/web/src/modules/onboarding/onboarding.utils.ts
rmdir /Users/augustos/dev/lakitu/apps/web/src/routes/onboarding
rmdir /Users/augustos/dev/lakitu/apps/web/src/modules/onboarding
```

- [ ] **Step 2: Remove the import of `mapNextStepToRoute` from `_authenticated.tsx`**

If Task 24 was completed correctly, this import is already removed. Verify:

```bash
cd /Users/augustos/dev/lakitu && grep -n "mapNextStepToRoute\|onboarding.utils" apps/web/src/routes/_authenticated.tsx
```

Expected: no output (import already removed in Task 24).

- [ ] **Step 3: Regenerate the route tree**

TanStack Router auto-generates `routeTree.gen.ts` from the file system. Deleting route files requires regeneration:

```bash
cd /Users/augustos/dev/lakitu && bun --filter web dev &
sleep 5
kill %1
```

Or, if TanStack Router has a generate command:

```bash
cd /Users/augustos/dev/lakitu && bun --filter web build 2>&1 | head -20
```

The route tree will be regenerated on the next `dev` or `build` run. The dev agent should verify that `routeTree.gen.ts` no longer references onboarding routes.

- [ ] **Step 4: Run typecheck to verify nothing is broken**

```bash
cd /Users/augustos/dev/lakitu && bun --filter web typecheck
```

Expected: no errors. If there are errors about missing onboarding routes or imports, fix them.

- [ ] **Step 5: Commit**

```bash
cd /Users/augustos/dev/lakitu && git add -A apps/web/src/routes/onboarding apps/web/src/modules/onboarding apps/web/src/routes/_authenticated.tsx apps/web/src/routeTree.gen.ts && git commit -m "$(cat <<'EOF'
refactor(web): remove onboarding routes, auth-setup machine handles all steps
EOF
)"
```

---

### Task 26: Add Toaster to Root Layout

**Files:**

- Modify: `apps/web/src/routes/__root.tsx`

The Toaster (from Sonner) should be mounted at the root level so toasts work globally. Currently the login route mounts its own Toaster, but for consistency, move it to root.

- [ ] **Step 1: Add Toaster to root route**

Update `apps/web/src/routes/__root.tsx`:

```typescript
import { createRootRouteWithContext, Outlet } from '@tanstack/react-router';
import { Toaster } from '@repo/ui/shadcn/sonner';
import type { QueryClient } from '@tanstack/react-query';

export interface RouterContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: () => (
    <>
      <Outlet />
      <Toaster position="top-right" />
    </>
  ),
});
```

Then remove the `<Toaster>` from the login route (Task 23). The dev agent should update `login.tsx` to remove the `<Toaster>` import and JSX.

- [ ] **Step 2: Commit**

```bash
cd /Users/augustos/dev/lakitu && git add apps/web/src/routes/__root.tsx apps/web/src/routes/login.tsx && git commit -m "$(cat <<'EOF'
feat(web): mount Toaster in root layout for global toast support
EOF
)"
```

---

### Task 27: Full Quality Check

**Files:** None (verification only)

- [ ] **Step 1: Run the full check suite**

```bash
cd /Users/augustos/dev/lakitu && bun check
```

This runs `format-check + oxlint + typecheck`. Expected: all pass.

- [ ] **Step 2: Fix any format issues**

If formatting fails:

```bash
cd /Users/augustos/dev/lakitu && bun format
```

Then re-run `bun check`.

- [ ] **Step 3: Fix any lint issues**

If oxlint reports issues, fix them. Common issues:

- Missing `import type` for type-only imports
- Unused variables
- Missing `data-testid` attributes (add them to interactive elements)

- [ ] **Step 4: Run the dev server to verify the UI renders**

```bash
cd /Users/augustos/dev/lakitu && bun dev
```

Open `http://localhost:5173/login` in a browser. Verify:

- Split-screen layout renders (brand panel left, form panel right)
- Email form is shown (the machine starts in `verification`, resolves to `email` since no token)
- No console errors

- [ ] **Step 5: Commit any fixes**

```bash
cd /Users/augustos/dev/lakitu && git add -A && git commit -m "$(cat <<'EOF'
fix(web): resolve lint and format issues from auth-setup implementation
EOF
)"
```

---

## Build Sequence Summary

The tasks must be executed in this order due to dependencies:

1. **Task 1** -- Install dependencies (everything else depends on this)
2. **Task 2** -- shadcn components (UI building blocks)
3. **Task 3** -- Font imports (needed for visual fidelity)
4. **Task 4** -- Mascot asset (needed by brand panel)
5. **Task 5** -- JWT decoder (needed by machine)
6. **Task 6** -- Types (needed by machine and components)
7. **Task 7** -- Schemas (needed by form components)
8. **Task 8** -- API functions (needed by machine)
9. **Task 9** -- Zustand store update (needed by machine and guard)
10. **Task 10** -- Export router (needed by machine)
11. **Task 11** -- XState machine (core, depends on 5-10)
12. **Task 12** -- Auth CSS (needed by layout components)
13. **Task 13** -- SVG components (needed by brand panel)
14. **Task 14** -- Brand panel (depends on 13)
15. **Task 15** -- Step indicator (needed by form panel)
16. **Task 16** -- Email screen (depends on 2, 7)
17. **Task 17** -- OTP screen (depends on 2, 7)
18. **Task 18** -- Company screen (depends on 2, 7, 8)
19. **Task 19** -- VeryAI screen (pure presentational)
20. **Task 20** -- Success + Error screens (depends on 12)
21. **Task 21** -- Form panel (depends on 15)
22. **Task 22** -- Auth layout (depends on 14, 21)
23. **Task 23** -- Login route (depends on 11, 22, 16-20)
24. **Task 24** -- Update authenticated guard (depends on 9)
25. **Task 25** -- Delete onboarding routes (depends on 24)
26. **Task 26** -- Toaster to root (depends on 2, 23)
27. **Task 27** -- Full quality check (depends on everything)

Tasks 13-20 can be parallelized (they are independent component files). Tasks 5-10 can also be partially parallelized.

---

## Risks and Edge Cases

### Token Expiry Mid-Flow

**Risk:** User starts auth, gets token after OTP, then sits on company step for 24h. Token expires.
**Mitigation:** The `checkOnboardingStatus` actor will receive a 401. The machine transitions to `error` state. On RETRY, the `verification` state re-runs, finds expired token, and transitions to `email`. The user must re-authenticate. This is correct behavior.

### VeryAI Redirect Flow

**Risk:** After VeryAI OAuth, the API callback returns JSON (not a redirect). The user sees raw JSON.
**Mitigation:** Flagged as a prerequisite API change. The API callback should be updated to redirect to `{FRONTEND_URL}/login` after processing. Until then, the user must manually navigate back. The machine's `verification` state handles re-entry correctly.

### Concurrent Tabs

**Risk:** User opens `/login` in two tabs. Both start machines. One completes auth, writes to Zustand + localStorage. The other tab's machine is stale.
**Mitigation:** Not handled in this plan. The second tab will continue its flow and potentially fail on API calls (duplicate company creation, etc.) or succeed independently. This is acceptable for MVP. Future improvement: `storage` event listener on `localStorage` to detect auth changes.

### Browser Back/Forward Button

**Risk:** User presses browser back during the flow. Since URL stays at `/login` throughout, browser back exits the entire flow (goes to previous page).
**Mitigation:** This is intentional. The auth flow is a single URL. Browser back leaves the flow. This is correct -- you don't "go back" in auth.

### XState v5 Machine HMR

**Risk:** During development, hot module reload may cause the machine to restart.
**Mitigation:** Normal behavior. The machine starts in `verification` which re-resolves position from localStorage token. If the token is valid, it skips to the correct step. This self-heals on HMR.

### Resend OTP

**Risk:** The "Resend code" button in the OTP step sends `SUBMIT_EMAIL` to re-trigger the challenge. But the machine is in the `otp` state, which does not handle `SUBMIT_EMAIL`.
**Mitigation:** The `onResend` callback in the login route should trigger a new challenge. Two options: (1) Add a `RESEND_CODE` event to the otp state that invokes `sendChallenge` without transitioning back to email. (2) Have the OTP screen component call the `sendChallenge` API directly (bypassing the machine) and show a toast. Option 2 is simpler and keeps the machine clean. The dev agent should implement option 2: import `sendChallenge` from `auth-setup.api.ts` and call it directly in the OTP screen's resend handler, showing a success/error toast via `sonner`'s `toast()`.

### Company Search Debounce

**Risk:** Rapid typing in the company search fires many API calls.
**Mitigation:** 300ms debounce in the component's `useEffect`. The dev agent should implement this with a `setTimeout` + cleanup pattern (not a library).

### `data-testid` Attributes

**Risk:** Missing test IDs make future e2e testing harder.
**Mitigation:** The dev agent should add `data-testid` to all interactive elements: `auth-loading`, `email-input`, `email-submit`, `otp-input`, `otp-back`, `otp-resend`, `company-name-input`, `company-create-submit`, `company-search-input`, `company-join-{id}`, `company-mode-toggle`, `logout-button`, `retry-button`, `success-screen`, `error-screen`.

### Eden Treaty Call Shapes

**Risk:** The exact Eden Treaty property chain for some endpoints (especially dynamic segments like `/companies/:id/join`) may not match what is written in the plan.
**Mitigation:** Task 8 includes a typecheck step. The dev agent must verify call shapes compile. If they do not, consult the generated Elysia type and adjust the calls accordingly.
