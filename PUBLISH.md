# Publishing the FundMyArt MCP Server

Step-by-step commands for the first release.
**You only do this once per version.** After v0.1.0, bump the version in `package.json` and re-run step 4.

---

## 1. Create the GitHub repo (one-time)

1. Go to https://github.com/new
2. Repository name: `fundmyart-mcp`
3. Owner: `TopeOsho`
4. Public
5. **Do not** initialise with README, .gitignore, or LICENSE — we already have them
6. Click **Create repository**

Then from Terminal:

```bash
cd /Users/topeosho/Documents/fundmyart-mcp
git init
git add .
git commit -m "Initial release: fundmyart-mcp v0.1.0"
git branch -M main
git remote add origin https://github.com/TopeOsho/fundmyart-mcp.git
```

Now open **GitHub Desktop**, add the existing repository at `/Users/topeosho/Documents/fundmyart-mcp`, and push to origin. (Or from Terminal: `git push -u origin main`.)

---

## 2. Log in to npm (one-time)

```bash
cd /Users/topeosho/Documents/fundmyart-mcp
npm login
```

You'll be prompted for:
- **Username:** `fundergallery`
- **Password:** (your npm password)
- **Email:** the email on your npm account
- **OTP:** if you have 2FA enabled

Verify login:
```bash
npm whoami
```
Should print `fundergallery`.

---

## 3. Pre-publish sanity check

```bash
cd /Users/topeosho/Documents/fundmyart-mcp
npm run build
npm test
node test/integration.mjs
```

All three must pass. The `prepublishOnly` script will run build + tests again during `npm publish`, so this is just to catch issues early.

---

## 4. Publish to npm

```bash
cd /Users/topeosho/Documents/fundmyart-mcp
npm publish --access public
```

If you have 2FA, npm will ask for an OTP.

Once published, verify:
- https://www.npmjs.com/package/fundmyart-mcp exists
- `npx -y fundmyart-mcp --help` (or just running it) starts the server

---

## 5. Test in Claude Desktop

1. Open `~/Library/Application Support/Claude/claude_desktop_config.json`
2. Add:

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

3. Quit and reopen Claude Desktop.
4. In a new chat, ask: *"What UK arts grants are open right now?"*
5. Confirm Claude uses the `search_grants` tool and returns real FundMyArt listings with `fund-my-art.com/grants/...` URLs.

---

## 6. Submit to registries (distribution)

### Smithery (highest priority — most traffic)

1. Go to https://smithery.ai
2. Sign in with GitHub
3. Submit `TopeOsho/fundmyart-mcp`
4. Fill in description, tags (`art`, `grants`, `funding`, `culture`)

### MCPT (mcp.so)

1. Go to https://mcp.so
2. Submit via their GitHub form or PR to their list repo

### Open Tools / awesome-mcp-servers

1. Fork https://github.com/punkpeye/awesome-mcp-servers
2. Add a line under an appropriate category:
   ```
   - [fundmyart-mcp](https://github.com/TopeOsho/fundmyart-mcp) — Search 1,999+ verified arts and culture grants.
   ```
3. Open a PR

---

## 7. Track usage

- **Web analytics:** GA4 will show traffic from `utm_source=mcp_server` with `utm_medium` set to the calling client name. Filter by that source to measure MCP-driven signups.
- **npm stats:** https://www.npmjs.com/package/fundmyart-mcp shows weekly download counts (updates ~daily).

---

## Releasing a new version

When you change the code:

```bash
cd /Users/topeosho/Documents/fundmyart-mcp

# 1. Bump version in package.json (pick one)
npm version patch   # 0.1.0 → 0.1.1  (bug fixes)
npm version minor   # 0.1.0 → 0.2.0  (new features, backward-compatible)
npm version major   # 0.1.0 → 1.0.0  (breaking changes)

# 2. Publish
npm publish

# 3. Push the version commit and tag
git push origin main --tags
```

Users on `npx -y fundmyart-mcp` pick up the new version automatically on next run.
