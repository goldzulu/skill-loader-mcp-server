# Skill Loader MCP Server

[![npm version](https://img.shields.io/npm/v/%40goldzulu/skill-loader-mcp-server)](https://www.npmjs.com/package/@goldzulu/skill-loader-mcp-server)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/node/v/@goldzulu/skill-loader-mcp-server.svg)](https://nodejs.org)

An MCP (Model Context Protocol) server for discovering, fetching, validating, and converting Claude skills from the [skills.sh](https://skills.sh) marketplace and GitHub repositories.

## What's New in v1.1.0

- **skills.sh API integration**: Search uses the `/api/search?q=<query>` endpoint — no authentication needed
- **Authenticated endpoints**: `list_skills` and `get_leaderboard` use the `/api/v1/skills` endpoint (requires `SKILLS_SH_API_KEY`)
- **Smarter Power conversion**: `convert_to_power` now generates `mcp.json` when a skill has dependencies or tool references, and creates a `steering/` directory when a skill has 3+ complex sections
- **MCP SDK upgrade**: Updated to `@modelcontextprotocol/sdk` v1.29

## Features

- **Discover Skills** — Browse and search the skills.sh marketplace via its public search API
- **Fetch Skills** — Download raw skill content directly from GitHub
- **Security Validation** — Scan skills for dangerous commands, suspicious patterns, and code injection
- **Format Conversion** — Convert skills to Kiro steering files or power format (with optional `mcp.json` and `steering/` directory)
- **Complete Workflow** — Import skills end-to-end with a single command (fetch + validate + convert)

## Installation

### Global Installation

```bash
npm install -g @goldzulu/skill-loader-mcp-server
```

### Local Installation

```bash
npm install @goldzulu/skill-loader-mcp-server
```

## Configuration

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `SKILLS_SH_API_KEY` | For `list_skills` and `get_leaderboard` only | API key for the skills.sh authenticated `/api/v1/skills` endpoint. Request from Vercel if needed. Not required for `search_skills`. |

### With Kiro

Add to your `mcp.json`:

```json
{
  "mcpServers": {
    "skill-loader": {
      "command": "npx",
      "args": ["-y", "@goldzulu/skill-loader-mcp-server"],
      "env": {
        "SKILLS_SH_API_KEY": "your-api-key-here"
      },
      "description": "Skill Loader MCP Server for managing Claude skills"
    }
  }
}
```

### With Claude Desktop

Add to your Claude Desktop configuration:

```json
{
  "mcpServers": {
    "skill-loader": {
      "command": "skill-loader-mcp-server",
      "env": {
        "SKILLS_SH_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

The `env` block is optional — only needed if you want to use `list_skills` or `get_leaderboard`.

### Standalone

```bash
skill-loader-mcp-server
```

## Available Tools

### 1. search_skills

Search for skills by keyword using the skills.sh search API. **No authentication required.**

**Parameters:**
- `query` (required): Search query
- `limit` (optional): Max results (default: 20, max: 50)

**Example:**
```json
{
  "tool": "search_skills",
  "arguments": { "query": "pdf", "limit": 5 }
}
```

### 2. list_skills

List all available skills from skills.sh with pagination. **Requires `SKILLS_SH_API_KEY`.**

**Parameters:**
- `page` (optional): Page number (default: 1)
- `pageSize` (optional): Results per page (default: 50, max: 100)

**Example:**
```json
{
  "tool": "list_skills",
  "arguments": { "page": 1, "pageSize": 10 }
}
```

### 3. get_leaderboard

Get trending or top-installed skills. **Requires `SKILLS_SH_API_KEY`.**

**Parameters:**
- `timeframe` (optional): `'all'` or `'24h'` (default: `'all'`)
- `limit` (optional): Max results (default: 20, max: 50)

**Example:**
```json
{
  "tool": "get_leaderboard",
  "arguments": { "timeframe": "24h", "limit": 10 }
}
```

### 4. fetch_skill

Fetch raw skill content from GitHub.

**Parameters:**
- `identifier` (required): Skill name or `owner/repo` format

**Example:**
```json
{
  "tool": "fetch_skill",
  "arguments": { "identifier": "anthropics/pdf-extractor" }
}
```

### 5. validate_skill

Validate skill content for security issues.

**Parameters:**
- `content` (required): Skill content to validate
- `url` (optional): Source URL for verification

**Example:**
```json
{
  "tool": "validate_skill",
  "arguments": {
    "content": "---\nname: Test\n---\n\n# Test",
    "url": "https://example.com/skill.md"
  }
}
```

### 6. convert_to_steering

Convert skill to Kiro steering file format.

**Parameters:**
- `content` (required): Skill content
- `sourceUrl` (optional): Original source URL

**Example:**
```json
{
  "tool": "convert_to_steering",
  "arguments": {
    "content": "---\nname: Test\ndescription: A test skill\n---\n\n# Test",
    "sourceUrl": "https://example.com/skill.md"
  }
}
```

### 7. convert_to_power

Convert skill to Kiro power format. Generates `mcp.json` when the skill has dependencies or tools, and a `steering/` directory when the skill has 3+ complex sections.

**Parameters:**
- `content` (required): Skill content
- `sourceUrl` (optional): Original source URL

**Example:**
```json
{
  "tool": "convert_to_power",
  "arguments": {
    "content": "---\nname: Test\ndescription: A test skill\n---\n\n# Test",
    "sourceUrl": "https://example.com/skill.md"
  }
}
```

### 8. import_skill

Complete import workflow (fetch + validate + convert).

**Parameters:**
- `identifier` (required): Skill identifier
- `outputFormat` (required): `'steering'` or `'power'`
- `skipValidation` (optional): Skip security validation (default: false)

**Example:**
```json
{
  "tool": "import_skill",
  "arguments": {
    "identifier": "anthropics/pdf-extractor",
    "outputFormat": "steering"
  }
}
```

## Security

The server includes security validation that scans for:
- Dangerous commands (`rm -rf`, `sudo`, `eval`, `exec`)
- Suspicious file operations (`/etc/`, `/usr/`, `/bin/`)
- Code injection patterns (`${...}`, `$(...)`)
- Untrusted sources (non-GitHub URLs)

Skills that fail security validation will be blocked from import unless explicitly skipped.

## Caching

The server caches skills.sh search results in memory for 1 hour to reduce API calls and improve performance. The cache is automatically refreshed when expired.

## Error Handling

All tools return errors in a consistent JSON format with descriptive messages. Common error types:
- **Network errors**: Connection issues, timeouts, HTTP errors
- **Validation errors**: Security issues, format problems
- **Parsing errors**: YAML syntax errors, invalid markdown
- **Resolution errors**: Skill not found, ambiguous identifiers

## Development

### Build

```bash
npm run build
```

### Test

```bash
npm test
```

### Watch Mode

```bash
npm run test:watch
```

## Requirements

- Node.js 18 or higher
- npm or yarn

## License

MIT

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## Support

For issues and questions, please open an issue on [GitHub](https://github.com/goldzulu/skill-loader-mcp-server/issues).
