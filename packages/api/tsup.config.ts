import { defineConfig } from 'tsup';

export default defineConfig((options) => ({
  entry: {
    index: 'src/sdk/index.ts',
    client: 'src/sdk/client.ts',
    core: 'src/sdk/core.ts',
    auth: 'src/sdk/auth.ts',
    companies: 'src/sdk/companies.ts',
    onboarding: 'src/sdk/onboarding.ts',
    agents: 'src/sdk/agents.ts',
    permissions: 'src/sdk/permissions.ts',
    'audit-log': 'src/sdk/audit-log.ts',
  },
  format: ['esm'],
  dts: true,
  splitting: true,
  clean: !options.watch,
  outDir: 'dist',
  external: ['zod'],
}));
