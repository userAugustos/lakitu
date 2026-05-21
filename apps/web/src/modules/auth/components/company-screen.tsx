import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';

import type { Company } from '@lakitu/api/companies';
import { Button } from '@repo/ui/shadcn/button';
import { Input } from '@repo/ui/shadcn/input';
import { Label } from '@repo/ui/shadcn/label';

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
  const errorAtModeSwitch = useRef(error);

  const visibleError = error === errorAtModeSwitch.current ? null : error;

  const handleModeSwitch = () => {
    errorAtModeSwitch.current = error;
    setMode(mode === 'create' ? 'join' : 'create');
  };

  return (
    <div>
      {mode === 'create' ? (
        <CreateMode onSubmit={onCreateCompany} isSubmitting={isSubmitting} error={visibleError} />
      ) : (
        <JoinMode onJoin={onJoinCompany} isSubmitting={isSubmitting} error={visibleError} />
      )}

      <p className="mt-4 text-center text-xs text-muted-foreground">
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            handleModeSwitch();
          }}
          className="border-b border-transparent text-foreground/70 hover:border-foreground/50 hover:text-foreground"
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
    formState: { errors },
  } = useForm<CreateCompanyFormValues>({
    resolver: zodResolver(createCompanySchema),
    mode: 'onSubmit',
  });

  const onValid = (data: CreateCompanyFormValues) => {
    onSubmit(data.name);
  };

  return (
    <form onSubmit={handleSubmit(onValid)} noValidate>
      <div className="mb-3.5">
        <Label htmlFor="company-name" className="mb-2 block text-xs font-semibold tracking-wide">
          Company name
        </Label>
        <Input
          id="company-name"
          type="text"
          autoFocus
          placeholder="Acme Corp"
          data-testid="company-name-input"
          {...register('name')}
        />
      </div>
      {errors.name && <p className="mt-1 text-[13px] text-destructive">{errors.name.message}</p>}
      {error && <p className="mt-1 text-[13px] text-destructive">{error}</p>}

      <Button type="submit" disabled={isSubmitting} data-testid="company-create-submit">
        {isSubmitting ? (
          <>
            <span className="size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
            <span>Creating...</span>
          </>
        ) : (
          'Create company'
        )}
      </Button>
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
      <div className="mb-3.5">
        <Label htmlFor="company-search" className="mb-2 block text-xs font-semibold tracking-wide">
          Search companies
        </Label>
        <Input
          id="company-search"
          type="text"
          autoFocus
          placeholder="Type to search..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          data-testid="company-search-input"
        />
      </div>

      {error && <p className="mt-1 text-[13px] text-destructive">{error}</p>}

      <div className="mt-1 flex flex-col gap-1">
        {searching && (
          <div className="inline-flex items-center gap-2.5 text-[13px] text-muted-foreground">
            <span className="size-3.5 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
            Searching...
          </div>
        )}

        {!searching && query.length > 0 && results.length === 0 && (
          <p className="text-[13px] text-muted-foreground">No companies found</p>
        )}

        {results.map((company) => (
          <Button
            key={company.id}
            type="button"
            variant="outline"
            disabled={isSubmitting}
            onClick={() => onJoin(company.id)}
            data-testid={`company-join-${company.id}`}
          >
            {company.name}
          </Button>
        ))}
      </div>
    </div>
  );
}
