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
