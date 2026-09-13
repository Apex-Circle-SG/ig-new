/** Server configuration only. Neither mode proves the remote agent's actual tool settings. */
export function generalAccessMode(env: Record<string, string | undefined>) {
  if (env.ASK_DATADOG_ENABLED !== 'true' || env.ASK_DATADOG_GENERAL_ENABLED !== 'true')
    return undefined;
  const agent = env.DD_AGENT_ID;
  if (!agent || !/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(agent)) return undefined;
  if (env.ASK_DATADOG_TOOL_FREE_AGENT_ID === agent) return 'tool-free-attestation' as const;
  if (env.ASK_DATADOG_PUBLIC_AGENT_ID === agent) return 'owner-authorized' as const;
  return undefined;
}
