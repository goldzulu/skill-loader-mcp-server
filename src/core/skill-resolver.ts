/**
 * Skill Resolver
 *
 * Resolves skill identifiers to GitHub URLs.
 * Uses the skills.sh search API for name-based lookups.
 */

import { ResolvedSkill, SkillShEntry, SkillsShSearchResponse, SkillsShSearchEntry } from './types.js';
import { NetworkError, SkillResolutionError, ErrorLogger } from './errors.js';

export class SkillResolver {
  /**
   * Resolve a skill identifier to a GitHub URL
   *
   * Resolution Logic:
   * 1. If identifier contains "/": Treat as owner/repo format
   *    - Parse as `owner/repo` or `owner/repo/skill-name`
   *    - Construct GitHub URL directly
   *    - Source: 'github'
   *
   * 2. If identifier is simple name: Query skills.sh search API
   *    - Search skills.sh API for matching skill
   *    - Get owner/repo from source field
   *    - Construct GitHub URL from metadata
   *    - Source: 'skills.sh'
   */
  async resolve(identifier: string): Promise<ResolvedSkill> {
    // Detect identifier format
    if (identifier.includes('/')) {
      // Owner/repo format - construct GitHub URL directly
      return this.resolveFromGitHub(identifier);
    } else {
      // Simple name - query skills.sh
      return this.resolveFromSkillsSh(identifier);
    }
  }

  /**
   * Resolve a skill from GitHub using owner/repo format
   * Supports formats:
   * - owner/repo (assumes skills/repo pattern)
   * - owner/repo/skill-name
   * - owner/skill-name (short format, assumes agent-skills repo)
   */
  private resolveFromGitHub(identifier: string): ResolvedSkill {
    try {
      const parts = identifier.split('/').filter(part => part.length > 0);

      // Validate we have at least 2 parts
      if (parts.length < 2) {
        const error = new SkillResolutionError(
          'Invalid identifier format',
          identifier,
          ['Try: owner/repo', 'Try: owner/repo/skill-name'],
          { expectedFormat: 'owner/repo or owner/repo/skill-name' }
        );
        ErrorLogger.log(error);
        throw error;
      }

      if (parts.length === 2) {
        // Format: owner/skill-name
        // Assume this is short format like "vercel-labs/vercel-react-best-practices"
        // which should resolve to vercel-labs/agent-skills/skills/vercel-react-best-practices
        const [owner, skillName] = parts;
        const repo = 'agent-skills';
        const skillPath = `skills/${skillName}`;
        const fullUrl = `https://raw.githubusercontent.com/${owner}/${repo}/main/${skillPath}/SKILL.md`;

        return {
          owner,
          repo,
          skillPath,
          fullUrl,
          source: 'github'
        };
      } else {
        // Format: owner/repo/skill-name or owner/repo/skills/skill-name
        const owner = parts[0];
        const repo = parts[1];
        const remainingParts = parts.slice(2);

        // If the path already includes 'skills/', use it as-is
        // Otherwise, prepend 'skills/' to the skill name
        let skillPath: string;
        if (remainingParts[0] === 'skills') {
          skillPath = remainingParts.join('/');
        } else {
          skillPath = `skills/${remainingParts.join('/')}`;
        }

        const fullUrl = `https://raw.githubusercontent.com/${owner}/${repo}/main/${skillPath}/SKILL.md`;

        return {
          owner,
          repo,
          skillPath,
          fullUrl,
          source: 'github'
        };
      }
    } catch (error) {
      if (error instanceof SkillResolutionError) {
        throw error;
      }
      const wrappedError = new SkillResolutionError(
        'Failed to resolve GitHub identifier',
        identifier,
        [],
        { originalError: error instanceof Error ? error.message : String(error) }
      );
      ErrorLogger.log(wrappedError);
      throw wrappedError;
    }
  }

  // Cache for skills.sh search results (1 hour TTL)
  private searchCache: Map<string, { data: SkillShEntry[]; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 60 * 60 * 1000; // 1 hour in milliseconds

  /**
   * Resolve a skill from skills.sh using the search API
   */
  private async resolveFromSkillsSh(identifier: string): Promise<ResolvedSkill> {
    try {
      // Search for the skill via the API
      const results = await this.searchSkillsSh(identifier);

      // Search for matching skill (case-insensitive)
      const normalizedIdentifier = identifier.toLowerCase();

      // Try exact match first
      const exactMatch = results.find(skill =>
        skill.name.toLowerCase() === normalizedIdentifier
      );

      if (exactMatch) {
        return this.skillShEntryToResolvedSkill(exactMatch);
      }

      // Try partial match
      const matches = results.filter(skill =>
        skill.name.toLowerCase().includes(normalizedIdentifier)
      );

      if (matches.length === 0) {
        const error = new SkillResolutionError(
          `Skill "${identifier}" not found in skills.sh directory`,
          identifier,
          ['Try using owner/repo format instead', 'Search skills.sh for available skills'],
          { searchedIn: 'skills.sh', totalResults: results.length }
        );
        ErrorLogger.log(error);
        throw error;
      }

      if (matches.length === 1) {
        return this.skillShEntryToResolvedSkill(matches[0]);
      }

      // Multiple matches - provide helpful error
      const matchList = matches.map(s => `${s.owner}/${s.repo}/${s.name}`);
      const error = new SkillResolutionError(
        `Multiple skills match "${identifier}"`,
        identifier,
        matchList,
        { matchCount: matches.length }
      );
      ErrorLogger.log(error);
      throw error;
    } catch (error) {
      if (error instanceof SkillResolutionError || error instanceof NetworkError) {
        throw error;
      }
      const wrappedError = new SkillResolutionError(
        'Failed to resolve skill from skills.sh',
        identifier,
        [],
        { originalError: error instanceof Error ? error.message : String(error) }
      );
      ErrorLogger.log(wrappedError);
      throw wrappedError;
    }
  }

  /**
   * Convert a SkillShEntry to a ResolvedSkill
   */
  private skillShEntryToResolvedSkill(entry: SkillShEntry): ResolvedSkill {
    const skillPath = `skills/${entry.name}`;
    const fullUrl = `https://raw.githubusercontent.com/${entry.owner}/${entry.repo}/main/${skillPath}/SKILL.md`;

    return {
      owner: entry.owner,
      repo: entry.repo,
      skillPath,
      fullUrl,
      source: 'skills.sh',
      metadata: {
        installs: entry.installs,
        trending: false
      }
    };
  }

  /**
   * Parse the `source` field from the search API (e.g. "anthropics/skills") into owner and repo
   */
  private parseSource(source: string): { owner: string; repo: string } {
    const parts = source.split('/');
    if (parts.length >= 2) {
      return { owner: parts[0], repo: parts[1] };
    }
    // Fallback: use source as owner, default repo
    return { owner: source, repo: 'agent-skills' };
  }

  /**
   * Convert a skills.sh search API entry to a SkillShEntry
   */
  private searchEntryToSkillShEntry(entry: SkillsShSearchEntry): SkillShEntry {
    const { owner, repo } = this.parseSource(entry.source);
    return {
      name: entry.name,
      owner,
      repo,
      installs: entry.installs,
      id: entry.id,
      skillId: entry.skillId,
      source: entry.source,
      description: `${entry.name} from ${entry.source}`,
      metadata: {
        trending: false
      }
    };
  }

  /**
   * Search skills.sh for skills matching a query using the search API
   *
   * Uses GET https://skills.sh/api/search?q=<query>
   */
  async searchSkillsSh(query: string): Promise<SkillShEntry[]> {
    const cacheKey = `search:${query.toLowerCase()}`;

    // Check cache
    const cached = this.searchCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < this.CACHE_TTL) {
      return cached.data;
    }

    try {
      const url = `https://skills.sh/api/search?q=${encodeURIComponent(query)}`;
      const response = await fetch(url);

      if (!response.ok) {
        const error = new NetworkError(
          'Failed to search skills.sh',
          url,
          {
            statusCode: response.status,
            context: { statusText: response.statusText }
          }
        );
        ErrorLogger.log(error);
        throw error;
      }

      const data = await response.json() as SkillsShSearchResponse;

      // Convert search entries to SkillShEntry format
      const skills = data.skills.map(entry => this.searchEntryToSkillShEntry(entry));

      // Update cache
      this.searchCache.set(cacheKey, {
        data: skills,
        timestamp: Date.now()
      });

      return skills;
    } catch (error) {
      // Return stale cache if available
      if (cached) {
        console.warn('Failed to fetch fresh skills.sh search data, using stale cache:', error);
        return cached.data;
      }

      if (error instanceof NetworkError) {
        throw error;
      }

      const wrappedError = new NetworkError(
        'Failed to search skills.sh',
        `https://skills.sh/api/search?q=${encodeURIComponent(query)}`,
        {
          context: {
            originalError: error instanceof Error ? error.message : String(error),
            suggestion: 'Check your internet connection and try again'
          }
        }
      );
      ErrorLogger.log(wrappedError);
      throw wrappedError;
    }
  }

  /**
   * Get the leaderboard from skills.sh
   *
   * Requires SKILLS_SH_API_KEY env var for the v1 paginated API.
   * Falls back to search API with a broad query if no key is set.
   */
  async getLeaderboard(timeframe: 'all' | '24h' = 'all', limit: number = 50): Promise<SkillShEntry[]> {
    const apiKey = process.env.SKILLS_SH_API_KEY;

    if (apiKey) {
      return this.getLeaderboardWithApiKey(apiKey, timeframe, limit);
    }

    // No API key - this endpoint requires authentication
    throw new Error(
      'The leaderboard endpoint requires a SKILLS_SH_API_KEY environment variable. ' +
      'Set SKILLS_SH_API_KEY to use the /api/v1/skills endpoint. ' +
      'Alternatively, use the search_skills tool which works without authentication.'
    );
  }

  /**
   * Fetch leaderboard using the authenticated v1 API
   */
  private async getLeaderboardWithApiKey(
    apiKey: string,
    timeframe: 'all' | '24h',
    limit: number
  ): Promise<SkillShEntry[]> {
    try {
      const view = timeframe === '24h' ? 'trending' : 'all-time';
      const url = `https://skills.sh/api/v1/skills?view=${view}&limit=${limit}&offset=0`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        const error = new NetworkError(
          'Failed to fetch leaderboard from skills.sh v1 API',
          url,
          {
            statusCode: response.status,
            context: { statusText: response.statusText, timeframe }
          }
        );
        ErrorLogger.log(error);
        throw error;
      }

      const data = await response.json() as any;
      const skills: SkillShEntry[] = (data.skills || []).map((entry: any, index: number) => ({
        name: entry.name,
        owner: entry.owner,
        repo: entry.repo,
        installs: entry.installs || 0,
        description: entry.description || `${entry.name} from ${entry.owner}/${entry.repo}`,
        id: entry.id,
        metadata: {
          trending: timeframe === '24h'
        }
      }));

      return skills;
    } catch (error) {
      if (error instanceof NetworkError) {
        throw error;
      }
      const wrappedError = new NetworkError(
        'Failed to fetch leaderboard',
        `https://skills.sh/api/v1/skills`,
        {
          context: {
            originalError: error instanceof Error ? error.message : String(error),
            timeframe
          }
        }
      );
      ErrorLogger.log(wrappedError);
      throw wrappedError;
    }
  }

  /**
   * List skills using the authenticated v1 API
   *
   * Requires SKILLS_SH_API_KEY env var.
   */
  async listSkills(page: number = 1, pageSize: number = 50): Promise<{ skills: SkillShEntry[]; total: number }> {
    const apiKey = process.env.SKILLS_SH_API_KEY;

    if (!apiKey) {
      throw new Error(
        'The list_skills tool requires a SKILLS_SH_API_KEY environment variable to paginate all skills. ' +
        'Set SKILLS_SH_API_KEY to use the /api/v1/skills endpoint. ' +
        'Alternatively, use the search_skills tool which works without authentication.'
      );
    }

    try {
      const offset = (page - 1) * pageSize;
      const url = `https://skills.sh/api/v1/skills?view=all-time&limit=${pageSize}&offset=${offset}`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        const error = new NetworkError(
          'Failed to list skills from skills.sh v1 API',
          url,
          {
            statusCode: response.status,
            context: { statusText: response.statusText }
          }
        );
        ErrorLogger.log(error);
        throw error;
      }

      const data = await response.json() as any;
      const skills: SkillShEntry[] = (data.skills || []).map((entry: any) => ({
        name: entry.name,
        owner: entry.owner,
        repo: entry.repo,
        installs: entry.installs || 0,
        description: entry.description || `${entry.name} from ${entry.owner}/${entry.repo}`,
        id: entry.id,
        metadata: {
          trending: false
        }
      }));

      return {
        skills,
        total: data.total || skills.length
      };
    } catch (error) {
      if (error instanceof NetworkError) {
        throw error;
      }
      const wrappedError = new NetworkError(
        'Failed to list skills',
        'https://skills.sh/api/v1/skills',
        {
          context: {
            originalError: error instanceof Error ? error.message : String(error)
          }
        }
      );
      ErrorLogger.log(wrappedError);
      throw wrappedError;
    }
  }

  /**
   * Parse install count string to number
   *
   * Converts human-readable install counts to numeric values.
   * Examples: "30.4K" -> 30400, "1.5M" -> 1500000, "973" -> 973
   */
  private parseInstallCount(str: string): number {
    const cleaned = str.trim();

    if (cleaned.endsWith('K')) {
      return Math.floor(parseFloat(cleaned.slice(0, -1)) * 1000);
    }

    if (cleaned.endsWith('M')) {
      return Math.floor(parseFloat(cleaned.slice(0, -1)) * 1000000);
    }

    return parseInt(cleaned, 10) || 0;
  }
}
