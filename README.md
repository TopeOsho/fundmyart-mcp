# FundMyArt MCP Server

Search **~2,000 verified arts and culture grants** directly from Claude, Cursor, or any MCP-compatible client.

FundMyArt maintains a live catalogue of arts and culture funding across UK, EU, US, and international sources. This MCP server plugs that catalogue into your AI assistant so it can answer funding questions with real grants, real deadlines, and real application links — not from training memory, not from the open internet.

## What you can do

Once installed, ask your AI assistant questions like:

- *"What production grants are open to a filmmaker in Scotland right now?"*
- *"I'm an emerging photographer looking for UK bursaries under £5k."*
- *"Our university runs a residency programme — what grants can fund participant stipends?"*
- *"Show me heritage craft bursaries with 2026 deadlines."*

You get a ranked list of real grants with:

- Title, funder, and live deadline
- Eligibility bullets
- A direct link to the full grant page at fund-my-art.com where you can apply

The catalogue refreshes continuously, so you will not get a grant that closed in February.

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

Restart Claude Desktop. The tools `search_grants` and `get_grant_details` will appear in the tools menu.

No account or API key required — the server ships with read-only credentials.

## Install (Cursor / Cline / other MCP clients)

Any client that supports stdio MCP servers can run `npx -y fundmyart-mcp`. Consult your client's MCP configuration docs for the exact JSON shape.

## Coverage

~2,000 verified grants across UK, EU, US, and international sources. Disciplines include visual arts, film, music, literature, craft, performance, and cross-disciplinary practice.

## Tools reference

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
