declare module 'cloudflare:workers' {
  export const env: import('./lib/cloudflare/database').StorageEnvironment;
}
