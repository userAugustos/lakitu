import { authRepository } from '@api/modules/auth/auth.repository';
import { badRequest, conflict, forbidden, notFound, unauthorized } from '@core/errors';

import { companiesRepository } from './companies.repository';
import type {
  Company,
  CreateCompanyRequest,
  ListMembersResponse,
  MyCompanyResponse,
  SearchCompaniesResponse,
} from './types';

function toCompanyDto(row: { id: string; name: string; createdAt: Date }): Company {
  return {
    id: row.id,
    name: row.name,
    created_at: row.createdAt.getTime(),
  };
}

async function create(userId: string, input: CreateCompanyRequest): Promise<Company> {
  const user = await authRepository.findUserById(userId);
  if (!user) throw unauthorized('auth.user_not_found', 'User not found');
  if (user.companyId)
    throw conflict('companies.already_member', 'User already belongs to a company');

  const name = input.name.trim();
  if (!name) throw badRequest('companies.name_empty', 'Company name cannot be blank');

  const existing = await companiesRepository.findByName(name);
  if (existing) throw conflict('companies.name_taken', 'A company with this name already exists');

  const row = await companiesRepository.createCompany({ name });
  companiesRepository.setUserCompany(userId, row.id);
  return toCompanyDto(row);
}

async function join(userId: string, companyId: string): Promise<Company> {
  const user = await authRepository.findUserById(userId);
  if (!user) throw unauthorized('auth.user_not_found', 'User not found');
  if (user.companyId)
    throw conflict('companies.already_member', 'User already belongs to a company');

  const company = await companiesRepository.findById(companyId);
  if (!company) throw notFound('companies.not_found', 'Company not found');

  companiesRepository.setUserCompany(userId, companyId);
  return toCompanyDto(company);
}

async function search(query: string): Promise<SearchCompaniesResponse> {
  const rows = await companiesRepository.searchByName(query);
  return { companies: rows.map(toCompanyDto) };
}

async function listMembers(userId: string, companyId: string): Promise<ListMembersResponse> {
  const company = await companiesRepository.findById(companyId);
  if (!company) throw notFound('companies.not_found', 'Company not found');

  const user = await authRepository.findUserById(userId);
  if (!user || user.companyId !== companyId) {
    throw forbidden('companies.not_member', 'You are not a member of this company');
  }

  const rows = await companiesRepository.findMembers(companyId);
  return { members: rows };
}

async function getMyCompany(userId: string): Promise<MyCompanyResponse> {
  const user = await authRepository.findUserById(userId);
  if (!user) throw unauthorized('auth.user_not_found', 'User not found');
  if (!user.companyId) return { company: null, member_count: 0 };

  const company = await companiesRepository.findById(user.companyId);
  if (!company) throw notFound('companies.not_found', 'Company not found');

  const memberCount = await companiesRepository.countMembers(company.id);
  return { company: toCompanyDto(company), member_count: memberCount };
}

export const companiesService = { create, join, search, listMembers, getMyCompany };
