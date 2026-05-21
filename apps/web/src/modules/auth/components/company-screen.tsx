import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import type { ChangeEvent } from 'react';

import type { Company, SearchCompaniesResponse } from '@lakitu/api/companies';
import { Button } from '@repo/ui/shadcn/button';
import { Input } from '@repo/ui/shadcn/input';
import { Label } from '@repo/ui/shadcn/label';

import { apiCall, lakituAuthApi } from '@/api';

import { FieldError } from './field-error';
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
    <div className="flex flex-col gap-3.5">
      {mode === 'create' ? (
        <CreateMode onSubmit={onCreateCompany} isSubmitting={isSubmitting} error={visibleError} />
      ) : (
        <JoinMode onJoin={onJoinCompany} isSubmitting={isSubmitting} error={visibleError} />
      )}

      <p className="text-muted-foreground text-center text-xs">
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            handleModeSwitch();
          }}
          className="text-foreground/70 hover:border-foreground/50 hover:text-foreground border-b border-transparent"
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
  const [dirty, setDirty] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    clearErrors,
  } = useForm<CreateCompanyFormValues>({
    resolver: zodResolver(createCompanySchema),
    mode: 'onSubmit',
  });

  useEffect(() => {
    if (error) setDirty(false);
  }, [error]);

  const onValid = (data: CreateCompanyFormValues) => {
    setDirty(false);
    onSubmit(data.name);
  };

  const { onChange: rhfOnChange, ...nameRegister } = register('name');
  const visibleError = dirty ? null : (errors.name?.message ?? error);

  return (
    <form onSubmit={handleSubmit(onValid)} noValidate className="flex flex-col gap-2.5">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="company-name" className="text-xs font-semibold tracking-wide">
          Company name
        </Label>
        <Input
          id="company-name"
          type="text"
          autoFocus
          placeholder="Acme Corp"
          data-testid="company-name-input"
          onChange={(e: ChangeEvent<HTMLInputElement>) => {
            void rhfOnChange(e);
            setDirty(true);
            clearErrors();
          }}
          {...nameRegister}
        />
        <FieldError message={visibleError} />
      </div>

      <Button type="submit" disabled={isSubmitting} data-testid="company-create-submit">
        {isSubmitting ? (
          <>
            <Loader2 className="animate-spin" />
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
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (error) setDirty(false);
  }, [error]);

  useEffect(() => {
    if (query.length < 1) {
      setResults([]);
      return;
    }

    setSearching(true);
    const timeout = setTimeout(async () => {
      try {
        const data = await apiCall<SearchCompaniesResponse>(() =>
          lakituAuthApi.companies.get({ $query: { q: query } })
        );
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
    <div className="flex flex-col gap-2.5">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="company-search" className="text-xs font-semibold tracking-wide">
          Search companies
        </Label>
        <Input
          id="company-search"
          type="text"
          autoFocus
          placeholder="Type to search..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setDirty(true);
          }}
          data-testid="company-search-input"
        />
        <FieldError message={dirty ? null : error} />
      </div>

      <div className="flex flex-col gap-1">
        {searching && (
          <div className="text-muted-foreground inline-flex items-center gap-2.5 text-[13px]">
            <Loader2 className="text-muted-foreground size-3.5 animate-spin" />
            Searching...
          </div>
        )}

        {!searching && query.length > 0 && results.length === 0 && (
          <p className="text-muted-foreground text-[13px]">No companies found</p>
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
