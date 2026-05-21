import type { ReactNode } from 'react';

import { BrandPanel } from './brand-panel';
import { FormPanel } from './form-panel';
import type { AuthScreen } from '../auth-setup.types';

interface AuthLayoutProps {
  screen: AuthScreen;
  children: ReactNode;
}

export function AuthLayout({ screen, children }: AuthLayoutProps) {
  return (
    <div className="grid min-h-screen grid-cols-[1.05fr_1fr] max-[980px]:grid-cols-1">
      <BrandPanel />
      <FormPanel screen={screen}>{children}</FormPanel>
    </div>
  );
}
