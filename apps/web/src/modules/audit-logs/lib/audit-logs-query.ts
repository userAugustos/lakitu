import { queryOptions } from '@tanstack/react-query';

import type { AuditDecision, AuditLogListResponse } from '@lakitu/api/audit-log';

import { apiCall, lakituAuthApi } from '@/api';

export function auditLogsQueryOptions(decision?: AuditDecision) {
  return queryOptions({
    queryKey: decision ? ['audit-logs', decision] : ['audit-logs'],
    queryFn: () =>
      apiCall<AuditLogListResponse>(() =>
        lakituAuthApi['audit-logs'].get({ $query: decision ? { decision } : {} })
      ),
    staleTime: 30_000,
  });
}
