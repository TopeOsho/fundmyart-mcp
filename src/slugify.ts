export interface SlugSource {
  id: string;
  title: string;
}

export function slugifyGrantTitle(title: string): string {
  let slug = title
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");

  if (slug.length > 120) {
    slug = slug.slice(0, 120).replace(/-+$/, "");
  }

  return slug || "grant";
}

export function shortHash(value: string, length = 6): string {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return Math.abs(hash >>> 0).toString(36).slice(0, length);
}

export function buildGrantSlugLookup<T extends SlugSource>(items: T[]): Record<string, string> {
  const baseCounts = new Map<string, number>();
  const usedSlugs = new Set<string>();
  const lookup: Record<string, string> = {};

  for (const item of items) {
    const baseSlug = slugifyGrantTitle(item.title);
    baseCounts.set(baseSlug, (baseCounts.get(baseSlug) ?? 0) + 1);
  }

  for (const item of items) {
    const baseSlug = slugifyGrantTitle(item.title);
    let slug = baseSlug;

    if ((baseCounts.get(baseSlug) ?? 0) > 1) {
      slug = `${baseSlug}-${shortHash(item.id)}`;
    }

    let hashLength = 7;
    while (usedSlugs.has(slug)) {
      slug = `${baseSlug}-${shortHash(item.id, hashLength)}`;
      hashLength += 1;
    }

    usedSlugs.add(slug);
    lookup[item.id] = slug;
  }

  return lookup;
}
