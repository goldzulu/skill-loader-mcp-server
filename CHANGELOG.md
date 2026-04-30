# Changelog

All notable changes to the Skill Loader MCP Server will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-04-30

### Changed
- **Breaking: skills.sh API migration** — Replaced HTML scraping with the official `GET /api/search?q=<query>` endpoint. The old `parseSkillsFromHTML()` approach is removed entirely since skills.sh moved to a Next.js RSC app.
- `search_skills` now calls the search API directly (no authentication required).
- `list_skills` and `get_leaderboard` now require a `SKILLS_SH_API_KEY` environment variable to use the authenticated `/api/v1/skills` endpoint. Without the key, they return a helpful error directing users to `search_skills`.
- Updated Power format output (`convert_to_power`) to optionally generate `mcp.json` (when skill has dependencies/tools) and `steering/` directory (when skill has 3+ complex sections).

### Added
- `SkillsShSearchResponse`, `SkillsShSearchEntry`, `SkillsShV1Response`, `SkillsShV1Entry` types for the new API responses.
- `id`, `skillId`, `source` fields on `SkillShEntry`.
- `listSkills()` method on `SkillResolver` for authenticated paginated listing.
- `mcp.json` generation in Power conversion for skills with dependencies or MCP server references.
- `steering/` directory generation in Power conversion for skills with multiple complex sections.

### Fixed
- Skills.sh integration no longer depends on fragile HTML parsing that broke when the site migrated to Next.js RSC.

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
