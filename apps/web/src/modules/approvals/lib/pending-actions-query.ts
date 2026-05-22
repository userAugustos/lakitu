import { queryOptions } from '@tanstack/react-query';

import type { ListPendingActionsResponse } from '@lakitu/api/pending-actions';

import { apiCall, lakituAuthApi } from '@/api';

export const pendingActionsQueryOptions = queryOptions({
  queryKey: ['pending-actions'],
  queryFn: () =>
    apiCall<ListPendingActionsResponse>(() => lakituAuthApi['pending-actions'].get({ $query: {} })),
  staleTime: 5_000,
  refetchInterval: 5_000,
});
