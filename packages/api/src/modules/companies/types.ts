import { t } from 'elysia';

export interface Company {
  id: string;
  name: string;
  created_at: number;
}

export interface CompanyMember {
  id: string;
  name: string | null;
  email: string;
}

export interface CreateCompanyRequest {
  name: string;
}

export interface SearchCompaniesQuery {
  q: string;
}

export interface SearchCompaniesResponse {
  companies: Company[];
}

export interface ListMembersResponse {
  members: CompanyMember[];
}

export const CompanySchema = t.Object({
  id: t.String(),
  name: t.String(),
  created_at: t.Number(),
});

export const CompanyMemberSchema = t.Object({
  id: t.String(),
  name: t.Union([t.String(), t.Null()]),
  email: t.String(),
});

export const CreateCompanyBodySchema = t.Object({
  name: t.String({ minLength: 1, maxLength: 100 }),
});

export const CompanyIdParamSchema = t.Object({
  id: t.String(),
});

export const SearchCompaniesQuerySchema = t.Object({
  q: t.String({ minLength: 1 }),
});

export const SearchCompaniesResponseSchema = t.Object({
  companies: t.Array(CompanySchema),
});

export const ListMembersResponseSchema = t.Object({
  members: t.Array(CompanyMemberSchema),
});
