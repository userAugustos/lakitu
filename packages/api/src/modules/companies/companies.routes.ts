import { Elysia } from 'elysia';

import { authMiddleware } from '@api/modules/auth/auth.middleware';

import { companiesService } from './companies.service';
import {
  CompanyIdParamSchema,
  CompanySchema,
  CreateCompanyBodySchema,
  ListMembersResponseSchema,
  SearchCompaniesQuerySchema,
  SearchCompaniesResponseSchema,
} from './types';

export const companiesRoutes = new Elysia({
  name: 'companies.routes',
  prefix: '/companies',
})
  .use(authMiddleware)
  .post('/', async ({ auth, body }) => companiesService.create(auth.sub, body), {
    body: CreateCompanyBodySchema,
    response: CompanySchema,
    detail: { summary: 'Create a company', tags: ['companies'] },
  })
  .get('/', async ({ query }) => companiesService.search(query.q), {
    query: SearchCompaniesQuerySchema,
    response: SearchCompaniesResponseSchema,
    detail: { summary: 'Search companies by name', tags: ['companies'] },
  })
  .post('/:id/join', async ({ auth, params }) => companiesService.join(auth.sub, params.id), {
    params: CompanyIdParamSchema,
    response: CompanySchema,
    detail: { summary: 'Join a company', tags: ['companies'] },
  })
  .get(
    '/:id/members',
    async ({ auth, params }) => companiesService.listMembers(auth.sub, params.id),
    {
      params: CompanyIdParamSchema,
      response: ListMembersResponseSchema,
      detail: { summary: 'List company members', tags: ['companies'] },
    }
  );
