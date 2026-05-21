import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';

import type { Company } from '@lakitu/api/companies';

import { searchCompanies } from '../auth-setup.api';
import { createCompanySchema } from '../auth-setup.schemas';
import type { CreateCompanyFormValues } from '../auth-setup.schemas';

interface CompanyScreenProps {
  onCreateCompany: (name: string) => void;
  onJoinCompany: (companyId: string) => void;
  isSubmitting: boolean;
  error: string | null;
}

export function CompanyScreen({
  onCreateCompany,
  onJoinCompany,
  isSubmitting,
  error,
}: CompanyScreenProps) {
  const [mode, setMode] = useState<'create' | 'join'>('create');

  return (
    <div>
      {mode === 'create' ? (
        <CreateMode onSubmit={onCreateCompany} isSubmitting={isSubmitting} error={error} />
      ) : (
        <JoinMode onJoin={onJoinCompany} isSubmitting={isSubmitting} error={error} />
      )}

      <p className="meta" style={{ marginTop: 16 }}>
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            setMode(mode === 'create' ? 'join' : 'create');
          }}
          data-testid="company-mode-toggle"
        >
          {mode === 'create' ? 'Join an existing company' : 'Create a new company'}
        </a>
      </p>
    </div>
  );
}

function CreateMode({
  onSubmit,
  isSubmitting,
  error,
}: {
  onSubmit: (name: string) => void;
  isSubmitting: boolean;
  error: string | null;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<CreateCompanyFormValues>({
    resolver: zodResolver(createCompanySchema),
    mode: 'onChange',
  });

  const onValid = (data: CreateCompanyFormValues) => {
    onSubmit(data.name);
  };

  return (
    <form onSubmit={handleSubmit(onValid)} noValidate>
      <div className="field">
        <label htmlFor="company-name">Company name</label>
        <input
          id="company-name"
          className="input"
          type="text"
          autoFocus
          placeholder="Acme Corp"
          data-testid="company-name-input"
          {...register('name')}
        />
      </div>
      {errors.name && <div className="field-error">{errors.name.message}</div>}
      {error && <div className="field-error">{error}</div>}

      <button
        type="submit"
        className="btn"
        disabled={!isValid || isSubmitting}
        data-testid="company-create-submit"
      >
        {isSubmitting ? (
          <>
            <span className="spinner" />
            <span>Creating...</span>
          </>
        ) : (
          'Create company'
        )}
      </button>
    </form>
  );
}

function JoinMode({
  onJoin,
  isSubmitting,
  error,
}: {
  onJoin: (companyId: string) => void;
  isSubmitting: boolean;
  error: string | null;
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Company[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (query.length < 1) {
      setResults([]);
      return;
    }

    setSearching(true);
    const timeout = setTimeout(async () => {
      try {
        const data = await searchCompanies(query);
        setResults(data.companies);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [query]);

  return (
    <div>
      <div className="field">
        <label htmlFor="company-search">Search companies</label>
        <input
          id="company-search"
          className="input"
          type="text"
          autoFocus
          placeholder="Type to search..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          data-testid="company-search-input"
        />
      </div>

      {error && <div className="field-error">{error}</div>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 4 }}>
        {searching && (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
              fontSize: 13,
              color: 'var(--muted)',
            }}
          >
            <span className="spinner" />
            Searching...
          </div>
        )}

        {!searching && query.length > 0 && results.length === 0 && (
          <p style={{ color: 'var(--muted)', fontSize: 13 }}>No companies found</p>
        )}

        {results.map((company) => (
          <button
            key={company.id}
            type="button"
            className="btn"
            style={{
              background: '#ffffff',
              color: 'var(--ink)',
              border: '1px solid var(--line-2)',
              boxShadow: 'none',
            }}
            disabled={isSubmitting}
            onClick={() => onJoin(company.id)}
            data-testid={`company-join-${company.id}`}
          >
            {company.name}
          </button>
        ))}
      </div>
    </div>
  );
}
