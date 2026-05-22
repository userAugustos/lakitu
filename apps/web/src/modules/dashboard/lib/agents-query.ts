import { queryOptions } from '@tanstack/react-query';

import type { ListAgentsResponse } from '@lakitu/api/agents';

import { apiCall, lakituAuthApi } from '@/api';

export const agentsQueryOptions = queryOptions({
  queryKey: ['agents'],
  queryFn: () => apiCall<ListAgentsResponse>(() => lakituAuthApi.agents.get()),
  refetchInterval: 10_000,
});
