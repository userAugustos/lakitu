import { createRootRouteWithContext, Outlet } from '@tanstack/react-router';
import type { QueryClient } from '@tanstack/react-query';

import { Toaster } from '@repo/ui/shadcn/sonner';
import { TooltipProvider } from '@repo/ui/shadcn/tooltip';

export interface RouterContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: () => (
    <TooltipProvider delayDuration={200}>
      <Outlet />
      <Toaster position="top-right" />
    </TooltipProvider>
  ),
});
