# Release v1.0.0 - Initial Release

## 🎉 First Release

This is the initial release of the Skill Loader MCP Server - an npm package that implements the Model Context Protocol (MCP) for discovering, fetching, validating, and converting Claude skills from skills.sh.

## ✨ Features

### 9 MCP Tools
1. **list-skills** - List all available skills with pagination
2. **search-skills** - Search skills by query with filters
3. **get-leaderboard** - Get top skills by category
4. **fetch-skill** - Fetch complete skill details
5. **validate-skill** - Security validation for dangerous patterns
6. **convert-to-power** - Convert skill to Kiro Power format
7. **convert-to-steering** - Convert skill to steering file format
8. **import-skill** - One-step import with validation and conversion
9. **get-skill-stats** - Get statistics about available skills

### Core Capabilities
- ✅ Security validation for dangerous patterns (eval, exec, file operations)
- ✅ In-memory caching with 1-hour TTL
- ✅ Retry logic with exponential backoff
- ✅ Comprehensive error handling
- ✅ TypeScript support with full type definitions
- ✅ CLI support for standalone usage

## 📦 Installation

```bash
npm install -g @goldzulu/skill-loader-mcp-server
```

## 🚀 Usage

### As MCP Server
Add to your MCP configuration:

```json
{
  "mcpServers": {
    "skill-loader": {
      "command": "npx",
      "args": ["-y", "@goldzulu/skill-loader-mcp-server"]
    }
  }
}
```

### As CLI
```bash
skill-loader-mcp-server
```

## 📚 Documentation

- [README](https://github.com/goldzulu/skill-loader-mcp-server#readme)
- [Examples](https://github.com/goldzulu/skill-loader-mcp-server/tree/main/examples)
- [Skill Loader Power](https://github.com/goldzulu/skill-loader-power) - Comprehensive documentation

## 🔗 Links

- **npm**: https://www.npmjs.com/package/@goldzulu/skill-loader-mcp-server
- **GitHub**: https://github.com/goldzulu/skill-loader-mcp-server
- **Issues**: https://github.com/goldzulu/skill-loader-mcp-server/issues

## 🙏 Acknowledgments

Built with:
- [@modelcontextprotocol/sdk](https://www.npmjs.com/package/@modelcontextprotocol/sdk)
- [TypeScript](https://www.typescriptlang.org/)
- [skills.sh](https://skills.sh) API

## 📝 License

MIT License - see [LICENSE](LICENSE) for details

---

**Full Changelog**: https://github.com/goldzulu/skill-loader-mcp-server/commits/v1.0.0
