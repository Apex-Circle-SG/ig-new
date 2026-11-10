export function redisCommand(env: object, command: (string | number)[]): Promise<unknown>;
export function rateLimit(
  env: object,
  namespace: string | number,
  key: string,
  maximum: number,
  windowMs: number,
): Promise<boolean>;
