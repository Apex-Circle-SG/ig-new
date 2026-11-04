declare module 'cloudflare:workers' {
  export const env: { SITE_DB: {
    prepare(sql: string): {
      all<T = Record<string, unknown>>(): Promise<{results: T[]}>;
      bind(...values: (string | number)[]): {
        first<T = Record<string, unknown>>(): Promise<T | null>;
        run(): Promise<{success: boolean; meta: {changes: number}}>;
      };
    };
  } };
}
