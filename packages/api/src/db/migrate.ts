import { migrate } from 'drizzle-orm/bun-sqlite/migrator';

import { auditLogService } from '@api/modules/audit-log/audit-log.service';

import { db } from './client';

migrate(db, { migrationsFolder: './src/db/migrations' });
auditLogService.bootstrapChain();
console.log('Migrations complete');
process.exit(0);
