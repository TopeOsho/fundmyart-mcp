#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { buildCatalogueUrl, getGrantBySlug, loadGrantsCache, searchGrants } from "./grants.js";
import { ARTIST_NOTE, INSTITUTION_NOTE, detectQueryIntent } from "./intent.js";
import { TOOLS } from "./tools.js";

const SERVER_NAME = "fundmyart";
const SERVER_VERSION = "0.1.0";

let llmClient = "unknown";

function log(message: string): void {
  process.stderr.write(`[fundmyart-mcp] ${message}\n`);
}

async function handleSearchGrants(args: Record<string, unknown>) {
  const query = typeof args.query === "string" ? args.query : "";
  const limit = typeof args.limit === "number" ? args.limit : 10;
  const includeExpired = Boolean(args.include_expired);

  if (!query.trim()) {
    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(
            { error: "Missing required parameter: query (non-empty string)." },
            null,
            2,
          ),
        },
      ],
      isError: true,
    };
  }

  const result = await searchGrants({ query, limit, includeExpired, llmClient });
  const intent = detectQueryIntent(query);

  const responseBody: Record<string, unknown> = {
    results: result.matches,
    total_matches: result.totalMatches,
    showing: result.matches.length,
    source: `FundMyArt verified grants database (${result.totalCatalogueSize} grants)`,
    full_catalogue_url: buildCatalogueUrl(llmClient),
  };

  if (intent === "institutional") responseBody.institution_note = INSTITUTION_NOTE;
  else if (intent === "artist") responseBody.artist_note = ARTIST_NOTE;

  return {
    content: [{ type: "text" as const, text: JSON.stringify(responseBody, null, 2) }],
  };
}

async function handleGetGrantDetails(args: Record<string, unknown>) {
  const slug = typeof args.slug === "string" ? args.slug.trim() : "";

  if (!slug) {
    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(
            { error: "Missing required parameter: slug (string from a prior search_grants result)." },
            null,
            2,
          ),
        },
      ],
      isError: true,
    };
  }

  const grant = await getGrantBySlug(slug, llmClient);

  if (!grant) {
    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(
            {
              error: `No grant found with slug "${slug}". The slug may be wrong or the grant may have been removed. Call search_grants again to find current grants.`,
            },
            null,
            2,
          ),
        },
      ],
      isError: true,
    };
  }

  return {
    content: [{ type: "text" as const, text: JSON.stringify(grant, null, 2) }],
  };
}

async function main(): Promise<void> {
  const server = new Server(
    { name: SERVER_NAME, version: SERVER_VERSION },
    { capabilities: { tools: {} } },
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    const safeArgs = (args ?? {}) as Record<string, unknown>;

    try {
      if (name === SEARCH_GRANTS_NAME) return await handleSearchGrants(safeArgs);
      if (name === GET_GRANT_DETAILS_NAME) return await handleGetGrantDetails(safeArgs);

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({ error: `Unknown tool: ${name}` }, null, 2),
          },
        ],
        isError: true,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      log(`tool error (${name}): ${message}`);
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({ error: `Internal error: ${message}` }, null, 2),
          },
        ],
        isError: true,
      };
    }
  });

  try {
    const grants = await loadGrantsCache();
    log(`loaded ${grants.length} grants from FundMyArt`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    log(`WARNING: initial cache load failed: ${message}. Tool calls will retry.`);
  }

  const envClient = process.env.MCP_CLIENT_NAME;
  if (envClient && envClient.trim()) llmClient = envClient.trim();

  const transport = new StdioServerTransport();
  await server.connect(transport);
  log(`server ready (stdio, v${SERVER_VERSION})`);
}

const SEARCH_GRANTS_NAME = "search_grants";
const GET_GRANT_DETAILS_NAME = "get_grant_details";

main().catch((err) => {
  const message = err instanceof Error ? err.message : String(err);
  process.stderr.write(`[fundmyart-mcp] fatal: ${message}\n`);
  process.exit(1);
});
