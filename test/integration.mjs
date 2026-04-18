import { loadGrantsCache, searchGrants, getGrantBySlug } from "../dist/grants.js";
import { detectQueryIntent } from "../dist/intent.js";

const log = (...args) => console.log("[integration]", ...args);

const TEST_QUERIES = [
  { query: "UK arts council grants for painters", expectInstitutional: false },
  { query: "our university wants to fund student residencies", expectInstitutional: true },
  { query: "I'm an emerging digital artist in Scotland", expectInstitutional: false, expectArtist: true },
  { query: "film funding deadlines 2026", expectInstitutional: false },
  { query: "heritage craft bursaries", expectInstitutional: false },
];

async function main() {
  log("loading cache…");
  const t0 = Date.now();
  const grants = await loadGrantsCache();
  log(`loaded ${grants.length} grants in ${Date.now() - t0}ms`);

  if (grants.length < 100) {
    throw new Error(`Expected >100 grants, got ${grants.length}. Cache load broken.`);
  }

  // Spot-check slug shape on first 3 grants
  const sample = grants.slice(0, 3);
  for (const g of sample) {
    if (!g.slug || g.slug.length < 3) {
      throw new Error(`Bad slug for grant ${g.id}: "${g.slug}"`);
    }
    log(`  slug sample: ${g.slug}  title: ${g.title.slice(0, 60)}`);
  }

  for (const t of TEST_QUERIES) {
    const result = await searchGrants({ query: t.query, limit: 5 });
    const intent = detectQueryIntent(t.query);
    log(`\nQ: "${t.query}"`);
    log(`   intent=${intent}  totalMatches=${result.totalMatches}  returned=${result.matches.length}`);
    for (const m of result.matches.slice(0, 3)) {
      log(`   - ${m.title} | ${m.deadline_label} | ${m.funder_name}`);
      log(`     ${m.fundmyart_url}`);
    }
    if (result.matches.length === 0) {
      log(`   WARN: zero matches for "${t.query}"`);
    }
  }

  // Detail lookup — use first grant from a real search
  const detailSearch = await searchGrants({ query: "arts council", limit: 1 });
  if (detailSearch.matches.length > 0) {
    const first = detailSearch.matches[0];
    const detail = await getGrantBySlug(first.slug);
    log(`\ndetail lookup for slug "${first.slug}":`);
    log(`   title: ${detail?.title}`);
    log(`   funder: ${detail?.funder_name}`);
    log(`   checklist: ${detail?.eligibility_checklist.length} bullets`);
    log(`   canonical_url: ${detail?.canonical_url}`);
    if (!detail) throw new Error("detail lookup returned null for valid slug");
  }

  log("\n✅ all integration checks passed");
}

main().catch((err) => {
  console.error("❌ integration failure:", err);
  process.exit(1);
});
