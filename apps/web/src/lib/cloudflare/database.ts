import { createTiDB } from '../../../../../scripts/storage/tidb.mjs';

type Result<T> = { success: boolean; results: T[]; meta: { changes: number } };
type Statement = {
  bind(...values: (string | number | null)[]): Statement;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  all<T = Record<string, unknown>>(): Promise<Result<T>>;
  run(): Promise<Result<never>>;
};
export type SiteDatabase = { prepare(sql: string): Statement };
export type StorageEnvironment = {
  SITE_DB?: SiteDatabase;
  TIDB_HOST?: string;
  TIDB_USERNAME?: string;
  TIDB_PASSWORD?: string;
  TIDB_DATABASE?: string;
  TIDB_NAMESPACE?: string;
  UPSTASH_REDIS_REST_URL?: string;
  UPSTASH_REDIS_REST_TOKEN?: string;
};
export function siteDatabase(env: StorageEnvironment): SiteDatabase {
  if (env.TIDB_HOST) return createTiDB(env, env.TIDB_NAMESPACE ?? 'site') as SiteDatabase;
  if (env.SITE_DB) return env.SITE_DB;
  throw new Error('Site storage is not configured');
}
