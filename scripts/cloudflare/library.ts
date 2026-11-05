import { env } from 'cloudflare:workers';
import tools from './tools.json';

export type LibraryTool = { id: string; title: string; category: string; subcategory: string; url: string };

export async function getLibraryTools(): Promise<LibraryTool[]> {
  try {
    const result = await env.SITE_DB.prepare('SELECT id, title, category, subcategory, url FROM library_tools ORDER BY rowid').all<LibraryTool>();
    return result.results;
  } catch {
    // shortcut: the stage database may not have the directory yet; seed it when staging needs editable data.
    return tools;
  }
}

import knowledge from './knowledge.json';
export type KnowledgeArticle = typeof knowledge[number];
export async function getKnowledgeArticles(): Promise<KnowledgeArticle[]> {
  try {
    const result = await env.SITE_DB.prepare('SELECT data FROM library_knowledge ORDER BY position').all<{ data: string }>();
    const stored = result.results.map((row) => JSON.parse(row.data) as KnowledgeArticle);
    const existing = new Set(stored.map((article) => article.slug));
    return [...stored, ...knowledge.filter((article) => !existing.has(article.slug))];
  } catch {
    // shortcut: use the bundled seed if the knowledge table is unavailable; migrate D1 before editing entries.
    return knowledge;
  }
}
