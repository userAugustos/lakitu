import { queryOptions } from '@tanstack/react-query';

import type { AuditDecision, AuditLogListResponse } from '@lakitu/api/audit-log';

import { apiCall, lakituAuthApi } from '@/api';

export interface AuditLogFilters {
  decision?: AuditDecision;
}

export function auditLogsQueryOptions(filters: AuditLogFilters = {}) {
  return queryOptions({
    queryKey: filters.decision ? ['audit-logs', filters.decision] : ['audit-logs'],
    queryFn: () =>
      apiCall<AuditLogListResponse>(() =>
        lakituAuthApi['audit-logs'].get({
          $query: filters.decision ? { decision: filters.decision } : {},
        })
      ),
    staleTime: 30_000,
  });
}
