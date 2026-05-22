import { queryOptions } from '@tanstack/react-query';

import type { MyCompanyResponse } from '@lakitu/api/companies';

import { apiCall, lakituAuthApi } from '@/api';

export const myCompanyQueryOptions = queryOptions({
  queryKey: ['my-company'],
  queryFn: () => apiCall<MyCompanyResponse>(() => lakituAuthApi.companies.mine.get()),
  staleTime: 30_000,
});
