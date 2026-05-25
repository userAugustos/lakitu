import type { VerifyChainResponse } from '@lakitu/api/audit-log';

import { apiCall, lakituAuthApi } from '@/api';

export async function verifyAuditLogChain(): Promise<VerifyChainResponse> {
  return apiCall<VerifyChainResponse>(() => lakituAuthApi['audit-logs'].verify.get());
}
