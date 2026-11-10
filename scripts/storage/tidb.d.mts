export const TABLES: Record<string, string[]>;
export function mysqlStatement(sql: string, namespace: string): string;
export function createTiDB(env: object, namespace: string, connection?: unknown): unknown;
export function connectTiDB(
  env: object,
): import('@tidbcloud/serverless').Connection<import('@tidbcloud/serverless').Config>;
