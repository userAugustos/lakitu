import type { ReactNode } from 'react';

import '../auth-setup.css';

import { BrandPanel } from './brand-panel';
import { FormPanel } from './form-panel';
import type { AuthScreen } from '../auth-setup.types';

interface AuthLayoutProps {
  screen: AuthScreen;
  children: ReactNode;
}

export function AuthLayout({ screen, children }: AuthLayoutProps) {
  return (
    <div className="shell">
      <BrandPanel />
      <FormPanel screen={screen}>{children}</FormPanel>
    </div>
  );
}
