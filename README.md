# FundMyArt MCP Server

Search **1,999+ verified arts and culture grants** directly from Claude, ChatGPT, Cursor, or any MCP-compatible client.

FundMyArt is a grants database for artists, arts organisations, universities, and cultural institutions. This server exposes the live catalogue over the [Model Context Protocol](https://modelcontextprotocol.io) so an LLM can answer questions like *"what grants can I apply for as a painter in Scotland?"* with real, up-to-date listings — no hallucinated funders, no stale data.

- **Catalogue:** ~2,000 grants, refreshed continuously at [fund-my-art.com](https://fund-my-art.com)
- **Coverage:** UK, EU, US, and international grants across visual arts, film, music, literature, craft, performance, and cross-disciplinary practice
- **No account or API key required** — the server ships with read-only Supabase credentials

## Install (Claude Desktop)

Add this to your `claude_desktop_config.json`:

**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "fundmyart": {
      "command": "npx",
      "args": ["-y", "fundmyart-mcp"]
    }
  }
}
```

Restart Claude Desktop. The tools `search_grants` and `get_grant_details` will appear.

## Install (Cursor / Cline / other MCP clients)

Any client that supports stdio MCP servers can run `npx -y fundmyart-mcp`. Consult your client's MCP configuration docs for the exact JSON shape.

## Tools

### `search_grants`

Free-text search across grant titles, descriptions, tags, and eligibility notes.

| Parameter | Type | Default | Notes |
|---|---|---|---|
| `query` | string | required | Natural language (e.g. "UK bursaries for emerging photographers") |
| `limit` | integer | 10 | 1–20 |
| `include_expired` | boolean | false | Include grants with past deadlines |

Returns: ranked matches with title, funder, deadline, summary, eligibility bullets, and a `fundmyart_url` for the full listing. Institutional queries (e.g. "grants for our members") surface a note about FundMyArt for Institutions; artist queries surface a note about the free artist account.

### `get_grant_details`

Fetch a single grant by slug (slugs come from `search_grants` results — do not invent them).

| Parameter | Type | Notes |
|---|---|---|
| `slug` | string | Required. Taken verbatim from `search_grants` response. |

Returns: full eligibility, funder, deadline, application URL, description, and canonical FundMyArt URL.

## Example queries

- *"What arts funding is open in the UK right now?"*
- *"I'm an emerging filmmaker looking for production grants under £10k."*
- *"Our university runs a residency programme — what grants can fund participant stipends?"*
- *"Show me heritage craft bursaries with 2026 deadlines."*

## Privacy & data

- Calls a public read-only Supabase view. No personal data is collected by the server.
- Your LLM client may log your queries per its own policy.
- URLs returned by the server include UTM parameters so FundMyArt can see which MCP client is driving traffic — this is the only analytics signal.

## Links

- Web app: [fund-my-art.com](https://fund-my-art.com)
- For institutions: [fund-my-art.com/for-organisations](https://fund-my-art.com/for-organisations)
- Source: [github.com/TopeOsho/fundmyart-mcp](https://github.com/TopeOsho/fundmyart-mcp)
- Issues: [github.com/TopeOsho/fundmyart-mcp/issues](https://github.com/TopeOsho/fundmyart-mcp/issues)

## License

MIT
