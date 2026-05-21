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
