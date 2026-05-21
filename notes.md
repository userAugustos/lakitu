Validate agents:

- This is the _showcase angle_: our gateway shouldn't trust an `agent_id` query string. It should require Ed25519-signed requests and validate the binding against Clawkey before running policy checks. That's how we demonstrate "we understand what they're shipping."

Fix OTP tester bypass\*\* — make challenge skip email + real-OTP for tester emails. (Small, ~30 min, e2e test that hits Mailpit's API to assert no message was sent.)

1. **Onboarding status endpoint** — `GET /onboarding/status` (contract only, conditions all false).
2. **Hard gate middleware** — `requireOnboarded`, 403 with `next_step`.
3. **Companies** — light membership + onboarding step.
4. **VeryAI link** — OAuth2.
5. **VeryAI verification** — status check.
6. **Re-verification** — gate behavior on flip-back.

<!-- auth store example, do not follow same types, use as example: -->

```ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@verofinance/api/auth';

/**
 * Admin Authentication Store
 *
 * Manages authentication state for the admin application.
 * Uses Zustand with localStorage persistence.
 *
 * Store name: 'vero-admin-auth-storage' for persistence
 */

interface AuthState {
  // User & Authentication
  user: User | null;
  token: string | null;
  isLoading: boolean;

  // Actions
  login: (token: string, user: User) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      // Initial state
      user: null,
      token: null,
      isLoading: false,

      // Login action - stores token and user
      login: (token, user) => {
        set({
          user,
          token,
          isLoading: false,
        });
      },

      // Logout action - clears all auth state
      logout: () => {
        set({
          user: null,
          token: null,
          isLoading: false,
        });
      },

      // Set loading state
      setLoading: (loading) => {
        set({ isLoading: loading });
      },
    }),
    {
      name: 'lakitu-admin-auth-storage',
      // Persist only necessary fields
      partialize: (state) => ({
        user: state.user,
        token: state.token,
      }),
    }
  )
);

/**
 * Get current auth state without subscribing to updates
 */
export const authStoreState = () => useAuthStore.getState();

/**
 * Auth actions - can be used without React context
 */
export const authActions = {
  /**
   * Check if user is authenticated (has valid token)
   */
  isAuthenticated: () => {
    const state = authStoreState();
    return Boolean(state.token && state.user);
  },

  /**
   * Get current auth token
   */
  getToken: () => {
    const state = authStoreState();
    return state.token;
  },

  /**
   * Logout and reload the page
   */
  logout: () => {
    useAuthStore.getState().logout();
    window.location.href = '/login';
  },
};

/**
 * Selectors for optimal re-renders
 */
export const authSelectors = {
  isAuthenticated: (state: AuthState) => Boolean(state.token && state.user),
  user: (state: AuthState) => state.user,
  token: (state: AuthState) => state.token,
  isLoading: (state: AuthState) => state.isLoading,
};
```
