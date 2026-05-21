import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { User } from '@lakitu/api/auth';

interface AuthState {
  user: User | null;
  token: string | null;
  returnUrl: string | null;

  login: (token: string, user: User) => void;
  logout: () => void;
  setReturnUrl: (url: string | null) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      returnUrl: null,

      login: (token, user) => {
        set({ user, token });
      },

      logout: () => {
        set({ user: null, token: null, returnUrl: null });
      },

      setReturnUrl: (url) => {
        set({ returnUrl: url });
      },
    }),
    {
      name: 'lakitu-auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
      }),
    }
  )
);

export const authStoreState = () => useAuthStore.getState();

export const authActions = {
  isAuthenticated: () => {
    const state = authStoreState();
    return Boolean(state.token && state.user);
  },

  getToken: () => {
    return authStoreState().token;
  },

  login: (user: User, token: string) => {
    useAuthStore.getState().login(token, user);
  },

  logout: () => {
    useAuthStore.getState().logout();
  },

  setReturnUrl: (url: string | null) => {
    useAuthStore.getState().setReturnUrl(url);
  },

  getReturnUrl: () => {
    return authStoreState().returnUrl;
  },
};

export const authSelectors = {
  isAuthenticated: (state: AuthState) => Boolean(state.token && state.user),
  user: (state: AuthState) => state.user,
  token: (state: AuthState) => state.token,
};
