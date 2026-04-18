import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { config } from "./config.js";
import { buildGrantSlugLookup, type SlugSource } from "./slugify.js";
import { formatDeadline, getFunderName, isDeadlineExpired, normalizeTags, truncateText, pickLatestGrantDate } from "./format.js";
import { buildEligibilityChecklist, buildEligibilitySummary } from "./eligibility.js";

const GRANT_SELECT_COLUMNS =
  "id, title, url, description, deadline, eligibility_criteria, tags, application_guide, application_url, last_updated, last_verified_at";

const BATCH_SIZE = 1000;

export interface GrantRow {
  id: string;
  title: string;
  url: string;
  description: string | null;
  deadline: string | null;
  eligibility_criteria: unknown;
  tags: string[] | null;
  application_guide: string | null;
  application_url: string | null;
  last_updated: string | null;
  last_verified_at: string | null;
}

export interface GrantWithSlug extends GrantRow {
  slug: string;
}

export interface GrantSummary {
  id: string;
  slug: string;
  title: string;
  funder_name: string;
  description: string;
  deadline: string | null;
  deadline_label: string;
  eligibility_summary: string;
  tags: string[];
  fundmyart_url: string;
  application_url: string;
}

export interface GrantDetail extends Omit<GrantSummary, "description"> {
  description: string;
  application_guide: string | null;
  eligibility_criteria: unknown;
  eligibility_checklist: string[];
  last_verified_at: string | null;
  last_modified: string | null;
  canonical_url: string;
}

const STOPWORDS = new Set([
  "a", "an", "the", "and", "or", "but", "for", "of", "in", "on", "at", "by",
  "with", "to", "from", "is", "are", "was", "were", "be", "been", "being",
  "as", "that", "this", "these", "those", "what", "which", "who", "whom",
  "i", "me", "my", "mine", "we", "us", "our", "ours", "you", "your", "yours",
  "he", "she", "it", "they", "them", "their",
  "can", "could", "would", "should", "may", "might", "will", "do", "does", "did",
  "am", "have", "has", "had",
  "about", "near", "under", "over", "above", "below", "between",
  "grant", "grants", "funding", "fund", "art", "arts", "artist", "artists",
  "available", "applicable", "apply", "application", "applying", "looking",
  "any", "some", "all",
]);

let cacheState: {
  grants: GrantWithSlug[];
  slugToGrant: Map<string, GrantWithSlug>;
  loadedAt: number;
} | null = null;

let inflightLoad: Promise<GrantWithSlug[]> | null = null;

export function createSupabaseClient(): SupabaseClient {
  return createClient(config.supabaseUrl, config.supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

async function fetchAllGrantRows(client: SupabaseClient): Promise<GrantRow[]> {
  const grants: GrantRow[] = [];
  let from = 0;

  while (true) {
    const to = from + BATCH_SIZE - 1;
    const { data, error } = await client
      .from("global_grants_cache")
      .select(GRANT_SELECT_COLUMNS)
      .order("title", { ascending: true })
      .range(from, to);

    if (error) {
      throw new Error(`Failed to load grants (rows ${from}-${to}): ${error.message}`);
    }

    const batch = (data ?? []) as unknown as GrantRow[];
    grants.push(...batch);

    if (batch.length < BATCH_SIZE) break;
    from += BATCH_SIZE;
  }

  return grants;
}

export async function loadGrantsCache(forceRefresh = false): Promise<GrantWithSlug[]> {
  const now = Date.now();
  const isStale = !cacheState || now - cacheState.loadedAt > config.cacheRefreshMs;

  if (cacheState && !forceRefresh && !isStale) {
    return cacheState.grants;
  }

  if (inflightLoad) return inflightLoad;

  inflightLoad = (async () => {
    const client = createSupabaseClient();
    const rows = await fetchAllGrantRows(client);
    const slugLookup = buildGrantSlugLookup(rows as SlugSource[]);
    const grants: GrantWithSlug[] = rows.map((row) => ({ ...row, slug: slugLookup[row.id] }));

    const slugToGrant = new Map<string, GrantWithSlug>();
    for (const grant of grants) slugToGrant.set(grant.slug, grant);

    cacheState = { grants, slugToGrant, loadedAt: Date.now() };
    return grants;
  })();

  try {
    return await inflightLoad;
  } finally {
    inflightLoad = null;
  }
}

export function buildFundMyArtUrl(slug: string, llmClient = "unknown"): string {
  const safeClient = encodeURIComponent(llmClient.slice(0, 32));
  return `${config.siteBaseUrl}/grants/${slug}?utm_source=${config.utmSource}&utm_medium=${safeClient}&utm_campaign=${config.utmCampaign}`;
}

export function buildCatalogueUrl(llmClient = "unknown"): string {
  const safeClient = encodeURIComponent(llmClient.slice(0, 32));
  return `${config.siteBaseUrl}/grants?utm_source=${config.utmSource}&utm_medium=${safeClient}&utm_campaign=${config.utmCampaign}`;
}

function tokenize(query: string): string[] {
  return query
    .toLowerCase()
    .replace(/[^a-z0-9£$€\s-]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .filter((token) => token.length > 1)
    .filter((token) => !STOPWORDS.has(token));
}

function scoreGrant(grant: GrantWithSlug, query: string, tokens: string[]): number {
  const title = grant.title.toLowerCase();
  const description = (grant.description ?? "").toLowerCase();
  const tags = normalizeTags(grant.tags).map((tag) => tag.toLowerCase());
  const normalizedQuery = query.toLowerCase().trim();

  let score = 0;

  if (normalizedQuery.length > 2 && title.includes(normalizedQuery)) {
    score += 10;
  }

  const uniqueTokens = new Set(tokens);
  for (const token of uniqueTokens) {
    if (title.includes(token)) score += 3;
    for (const tag of tags) {
      if (tag.includes(token)) {
        score += 2;
        break;
      }
    }
    if (description.includes(token)) score += 1;
  }

  return score;
}

function toGrantSummary(grant: GrantWithSlug, llmClient: string): GrantSummary {
  return {
    id: grant.id,
    slug: grant.slug,
    title: grant.title,
    funder_name: getFunderName(grant.application_url, grant.url),
    description: truncateText(grant.description ?? "", 300),
    deadline: grant.deadline,
    deadline_label: formatDeadline(grant.deadline),
    eligibility_summary: buildEligibilitySummary(grant.eligibility_criteria),
    tags: normalizeTags(grant.tags),
    fundmyart_url: buildFundMyArtUrl(grant.slug, llmClient),
    application_url: grant.application_url || grant.url,
  };
}

export interface SearchOptions {
  query: string;
  limit?: number;
  includeExpired?: boolean;
  llmClient?: string;
}

export interface SearchResult {
  matches: GrantSummary[];
  totalMatches: number;
  totalCatalogueSize: number;
}

export async function searchGrants(options: SearchOptions): Promise<SearchResult> {
  const { query, limit = 10, includeExpired = false, llmClient = "unknown" } = options;
  const cappedLimit = Math.min(Math.max(1, limit), 20);

  const grants = await loadGrantsCache();
  const tokens = tokenize(query);
  const hasQuery = query.trim().length > 0 && tokens.length > 0;

  const filtered = grants.filter((grant) => includeExpired || !isDeadlineExpired(grant.deadline));

  let ranked: GrantWithSlug[];

  if (hasQuery) {
    const scored = filtered
      .map((grant) => ({ grant, score: scoreGrant(grant, query, tokens) }))
      .filter((entry) => entry.score > 0)
      .sort((a, b) => (b.score - a.score) || a.grant.title.localeCompare(b.grant.title));
    ranked = scored.map((entry) => entry.grant);
  } else {
    ranked = filtered
      .slice()
      .sort((a, b) => {
        const aDate = a.deadline ? new Date(a.deadline).getTime() : Number.POSITIVE_INFINITY;
        const bDate = b.deadline ? new Date(b.deadline).getTime() : Number.POSITIVE_INFINITY;
        if (!Number.isNaN(aDate) && !Number.isNaN(bDate) && aDate !== bDate) return aDate - bDate;
        return a.title.localeCompare(b.title);
      });
  }

  const top = ranked.slice(0, cappedLimit);

  return {
    matches: top.map((grant) => toGrantSummary(grant, llmClient)),
    totalMatches: ranked.length,
    totalCatalogueSize: grants.length,
  };
}

export async function getGrantBySlug(slug: string, llmClient = "unknown"): Promise<GrantDetail | null> {
  if (!slug || typeof slug !== "string") return null;
  await loadGrantsCache();
  const grant = cacheState?.slugToGrant.get(slug);
  if (!grant) return null;

  return {
    id: grant.id,
    slug: grant.slug,
    title: grant.title,
    funder_name: getFunderName(grant.application_url, grant.url),
    description: (grant.description ?? "").trim(),
    application_guide: grant.application_guide,
    deadline: grant.deadline,
    deadline_label: formatDeadline(grant.deadline),
    eligibility_criteria: grant.eligibility_criteria,
    eligibility_checklist: buildEligibilityChecklist(grant.eligibility_criteria),
    eligibility_summary: buildEligibilitySummary(grant.eligibility_criteria),
    tags: normalizeTags(grant.tags),
    application_url: grant.application_url || grant.url,
    last_verified_at: grant.last_verified_at,
    last_modified: pickLatestGrantDate(grant.last_updated, grant.last_verified_at),
    canonical_url: buildFundMyArtUrl(grant.slug, llmClient),
    fundmyart_url: buildFundMyArtUrl(grant.slug, llmClient),
  };
}

export function _resetCacheForTests(): void {
  cacheState = null;
  inflightLoad = null;
}
