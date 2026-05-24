import { queryOptions } from '@tanstack/react-query';

import type { ListToolsResponse } from '@lakitu/api/tools';

import { apiCall, lakituAuthApi } from '@/api';

export function toolsQueryOptions() {
  return queryOptions({
    queryKey: ['tools'],
    queryFn: () => apiCall<ListToolsResponse>(() => lakituAuthApi.tools.get()),
    staleTime: 60 * 60_000,
  });
}
