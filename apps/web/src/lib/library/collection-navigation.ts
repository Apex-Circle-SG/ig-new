import navigation from './business/collection-navigation.json';

export const collectionNavigation = navigation;
const collections = new Map(navigation.map((collection) => [collection.slug, collection]));
const parents = new Map(navigation.flatMap((collection) => collection.members.map((slug) => [slug, collection.slug] as const)));

export function primaryCollection(slug: string) {
  return collections.get(parents.get(slug) ?? '');
}

export function collectionPath(slug: string) {
  const path: typeof navigation = [];
  let collection = primaryCollection(slug);
  while (collection) {
    path.unshift(collection);
    collection = collections.get(collection.parent);
  }
  return path;
}

export function collectionContains(collection: string, slug: string) {
  return collectionPath(slug).some((ancestor) => ancestor.slug === collection);
}
