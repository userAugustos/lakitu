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

export async function fetchOnboardingStatus(): Promise<OnboardingStatus> {
  return apiCall<OnboardingStatus>(() => lakituAuthApi.onboarding.status.get());
}

export async function fetchProfile(): Promise<User> {
  return apiCall<User>(() => lakituAuthApi.auth.profile.get());
}

export async function createCompany(name: string): Promise<Company> {
  return apiCall<Company>(() => lakituAuthApi.companies.post({ name }));
}

export async function joinCompany(companyId: string): Promise<Company> {
  return apiCall<Company>(() => lakituAuthApi.companies[companyId]!.join.post());
}

export async function searchCompanies(query: string): Promise<SearchCompaniesResponse> {
  return apiCall<SearchCompaniesResponse>(() =>
    lakituAuthApi.companies.get({ $query: { q: query } })
  );
}

export async function startVeryAiLink(): Promise<{ authorize_url: string }> {
  return apiCall<{ authorize_url: string }>(() => lakituAuthApi.onboarding['very-ai'].start.post());
}
