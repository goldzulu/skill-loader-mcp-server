# Changelog

All notable changes to the Skill Loader MCP Server will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-02-03

### Added
- Initial release of Skill Loader MCP Server
- 9 MCP tools for skill management:
  - `list_skills`: List all available skills from skills.sh
  - `search_skills`: Search for skills by keyword
  - `get_leaderboard`: Get trending or top-installed skills
  - `fetch_skill`: Fetch raw skill content from GitHub
  - `validate_skill`: Validate skill content for security issues
  - `convert_to_steering`: Convert skill to Kiro steering file format
  - `convert_to_power`: Convert skill to Kiro power format
  - `import_skill`: Complete import workflow (fetch + validate + convert)
- Security validation for dangerous commands and patterns
- In-memory caching for skills.sh directory (1 hour TTL)
- Retry logic with exponential backoff for network requests
- Comprehensive error handling and logging
- TypeScript type definitions
- CLI entry point for running the server
- Support for stdio transport
- Compatible with Kiro and Claude Desktop

### Features
- Discover skills from skills.sh marketplace
- Fetch skills from GitHub repositories
- Security scanning for malicious patterns
- Convert skills to Kiro formats (steering files and powers)
- Complete import workflow with validation
- Pagination support for listing and searching
- Trending skills leaderboard
- Multiple branch fallback (main, master, HEAD)

### Documentation
- Comprehensive README with installation and usage instructions
- Usage examples for all tools
- MCP configuration examples
- API documentation with TypeScript types

## [Unreleased]

### Planned Features
- Batch operations for importing multiple skills
- Custom repository support beyond skills.sh
- Skill versioning and update tracking
- Persistent caching with Redis/file system
- Webhook notifications for new skills
- Analytics and usage tracking
- Additional output formats
- Skill dependency resolution
- Offline mode with local cache

---

For more information, see the [README](README.md) and [usage examples](examples/usage-examples.md).
