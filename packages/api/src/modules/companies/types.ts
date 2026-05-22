import { z } from 'zod';

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

export const CompanySchema = z.object({
  id: z.string(),
  name: z.string(),
  created_at: z.number(),
});

export const CompanyMemberSchema = z.object({
  id: z.string(),
  name: z.string().nullable(),
  email: z.string(),
});

export const CreateCompanyBodySchema = z.object({
  name: z.string().min(1).max(100),
});

export const CompanyIdParamSchema = z.object({
  id: z.string(),
});

export const SearchCompaniesQuerySchema = z.object({
  q: z.string().min(1),
});

export const SearchCompaniesResponseSchema = z.object({
  companies: z.array(CompanySchema),
});

export const ListMembersResponseSchema = z.object({
  members: z.array(CompanyMemberSchema),
});

export interface MyCompanyResponse {
  company: Company | null;
  member_count: number;
}

export const MyCompanyResponseSchema = z.object({
  company: CompanySchema.nullable(),
  member_count: z.number(),
});
