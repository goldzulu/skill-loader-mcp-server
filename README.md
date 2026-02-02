# Skill Loader MCP Server

[![npm version](https://badge.fury.io/js/%40goldzulu%2Fskill-loader-mcp-server.svg)](https://www.npmjs.com/package/@goldzulu/skill-loader-mcp-server)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/node/v/@goldzulu/skill-loader-mcp-server.svg)](https://nodejs.org)

An MCP (Model Context Protocol) server for discovering, fetching, validating, and converting Claude skills from skills.sh and GitHub repositories.

## Features

- 🔍 **Discover Skills**: Browse and search the skills.sh marketplace
- 📥 **Fetch Skills**: Download skill content from GitHub
- 🔒 **Security Validation**: Scan skills for dangerous patterns
- 🔄 **Format Conversion**: Convert skills to Kiro steering files or powers
- ⚡ **Complete Workflow**: Import skills with a single command

## Installation

### Global Installation

```bash
npm install -g @goldzulu/skill-loader-mcp-server
```

### Local Installation

```bash
npm install @goldzulu/skill-loader-mcp-server
```

## Usage

### With Kiro

Add to your `mcp.json`:

```json
{
  "mcpServers": {
    "skill-loader": {
      "command": "npx",
      "args": ["-y", "@goldzulu/skill-loader-mcp-server"],
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
      "command": "skill-loader-mcp-server"
    }
  }
}
```

### Standalone

```bash
skill-loader-mcp-server
```

## Available Tools

### 1. list_skills

List all available skills from skills.sh with pagination.

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

### 2. search_skills

Search for skills by keyword.

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

### 3. get_leaderboard

Get trending or top-installed skills.

**Parameters:**
- `timeframe` (optional): 'all' or '24h' (default: 'all')
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
- `identifier` (required): Skill name or owner/repo format

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
    "content": "---\nname: Test\n---\n\n# Test",
    "sourceUrl": "https://example.com/skill.md"
  }
}
```

### 7. convert_to_power

Convert skill to Kiro power format.

**Parameters:**
- `content` (required): Skill content
- `sourceUrl` (optional): Original source URL

**Example:**
```json
{
  "tool": "convert_to_power",
  "arguments": {
    "content": "---\nname: Test\n---\n\n# Test",
    "sourceUrl": "https://example.com/skill.md"
  }
}
```

### 8. import_skill

Complete import workflow (fetch + validate + convert).

**Parameters:**
- `identifier` (required): Skill identifier
- `outputFormat` (required): 'steering' or 'power'
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

## Quick Start

### 1. Install the package

```bash
npm install -g @kiro/skill-loader-mcp-server
```

### 2. Configure in Kiro

Add to your `mcp.json`:

```json
{
  "mcpServers": {
    "skill-loader": {
      "command": "skill-loader-mcp-server"
    }
  }
}
```

### 3. Use the tools

Once configured, you can use any of the 9 tools through your MCP client.

**Example workflow:**
1. Search for skills: `search_skills` with query "pdf"
2. Fetch a skill: `fetch_skill` with identifier "anthropics/pdf-extractor"
3. Import the skill: `import_skill` with identifier and output format

## Examples

See [examples/usage-examples.md](examples/usage-examples.md) for detailed examples of all tools.

## Security

The server includes security validation that scans for:
- Dangerous commands (rm -rf, sudo, eval, exec)
- Suspicious file operations (/etc/, /usr/, /bin/)
- Code injection patterns (${...}, $(...))
- Untrusted sources (non-GitHub URLs)

Skills that fail security validation will be blocked from import unless explicitly skipped.

## Caching

The server caches the skills.sh directory for 1 hour to reduce API calls and improve performance. The cache is stored in memory and is automatically refreshed when expired.

## Error Handling

All tools return errors in a consistent format with descriptive messages. Common error types:
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

Contributions are welcome! Please open an issue or submit a pull request.

## Support

For issues and questions, please open an issue on [GitHub](https://github.com/goldzulu/skill-loader-mcp-server/issues).
