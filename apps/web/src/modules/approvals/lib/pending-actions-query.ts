import { queryOptions } from '@tanstack/react-query';

import type {
  ListPendingActionsResponse,
  PendingActionsCountResponse,
} from '@lakitu/api/pending-actions';

import { apiCall, lakituAuthApi } from '@/api';

export const pendingActionsQueryOptions = queryOptions({
  queryKey: ['pending-actions'],
  queryFn: () =>
    apiCall<ListPendingActionsResponse>(() => lakituAuthApi['pending-actions'].get({ $query: {} })),
  staleTime: 5_000,
  refetchInterval: 5_000,
});

export const pendingActionsCountQueryOptions = queryOptions({
  queryKey: ['pending-actions', 'count'],
  queryFn: () =>
    apiCall<PendingActionsCountResponse>(() => lakituAuthApi['pending-actions'].count.get()),
  staleTime: 10_000,
  refetchInterval: 10_000,
});
