import { env } from 'cloudflare:workers';
import { DEAL_TOOLS } from '@insightginie/calculators/deals';
import { canonical } from '@insightginie/seo';
import { cache } from 'react';
import { siteDatabase } from '../cloudflare/database';
import { redisCommand } from '../../../../../scripts/storage/redis.mjs';
import tools from './tools.json';
import knowledge from './knowledge.json';

export type LibraryTool = {
  id: string;
  title: string;
  category: string;
  subcategory: string;
  url: string;
};
export type KnowledgeArticle = (typeof knowledge)[number];
const local = new Map<string, { expires: number; rows: unknown[] }>();

async function storedRows<T>(name: string, sql: string): Promise<T[]> {
  const key = `insightginie:site-data:v1:${env.TIDB_NAMESPACE ?? 'site'}:${name}`;
  const previous = local.get(key);
  if (previous && previous.expires > Date.now()) return previous.rows as T[];
  const redis = env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN;
  let rows: T[] | undefined;
  if (redis)
    try {
      const hit = await redisCommand(env, ['GET', key]);
      if (typeof hit === 'string') {
        const parsed = JSON.parse(hit);
        if (Array.isArray(parsed)) rows = parsed;
      }
    } catch {
      /* The authoritative store remains available during cache outages. */
    }
  if (!rows) {
    rows = (await siteDatabase(env).prepare(sql).all<T>()).results;
    if (redis)
      try {
        await redisCommand(env, ['SET', key, JSON.stringify(rows), 'EX', 300]);
      } catch {
        /* Bounded local cache still applies. */
      }
  }
  local.set(key, { expires: Date.now() + 30_000, rows });
  return rows;
}

export const getLibraryTools = cache(async (): Promise<LibraryTool[]> => {
  let stored: LibraryTool[];
  try {
    stored =
      env.TIDB_NAMESPACE === 'stage'
        ? tools
        : await storedRows<LibraryTool>(
            'tools',
            'SELECT id, title, category, subcategory, url FROM library_tools ORDER BY _position',
          );
  } catch {
    stored = tools;
  }
  const all = new Map(stored.map((tool) => [tool.id, tool]));
  for (const tool of tools) if (!all.has(tool.id)) all.set(tool.id, tool);
  for (const tool of DEAL_TOOLS)
    all.set(tool.id, {
      id: tool.id,
      title: tool.title,
      category: 'Calculators',
      subcategory: tool.category,
      url: canonical(tool.path),
    });
  return [...all.values()];
});

export const getKnowledgeArticles = cache(async (): Promise<KnowledgeArticle[]> => {
  if (env.TIDB_NAMESPACE === 'stage') return knowledge;
  try {
    const rows = await storedRows<{ data: string }>(
      'knowledge',
      'SELECT data FROM library_knowledge ORDER BY position',
    );
    const stored = rows.map((row) => JSON.parse(row.data) as KnowledgeArticle);
    const curatedAI = knowledge.filter((article) => article.topic === 'Artificial intelligence');
    const curatedSlugs = new Set(curatedAI.map((article) => article.slug));
    const storedNonAI = stored.filter(
      (article) => article.topic !== 'Artificial intelligence' && !curatedSlugs.has(article.slug),
    );
    const existing = new Set(storedNonAI.map((article) => article.slug));
    return [
      ...storedNonAI,
      ...knowledge.filter(
        (article) => article.topic !== 'Artificial intelligence' && !existing.has(article.slug),
      ),
      ...curatedAI,
    ];
  } catch {
    return knowledge;
  }
});
