import { PgTable } from 'drizzle-orm/pg-core';

export interface AutoCrudConfig {
  schema: PgTable;
}
