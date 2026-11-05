import tools from './tools.json';

export type LibraryTool = { id: string; title: string; category: string; subcategory: string; url: string };

export async function getLibraryTools(): Promise<LibraryTool[]> {
  return tools;
}
