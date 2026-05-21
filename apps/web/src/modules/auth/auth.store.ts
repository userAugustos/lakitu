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
