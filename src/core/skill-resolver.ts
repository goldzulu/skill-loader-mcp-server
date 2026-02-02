/**
 * Skill Resolver
 * 
 * Resolves skill identifiers to GitHub URLs.
 */

import { ResolvedSkill, SkillShEntry } from './types.js';
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
   * 2. If identifier is simple name: Query skills.sh
   *    - Search skills.sh directory for matching skill
   *    - Get owner/repo from skills.sh metadata
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

  // Cache for skills.sh directory (1 hour TTL)
  private skillsCache: { data: SkillShEntry[]; timestamp: number } | null = null;
  private readonly CACHE_TTL = 60 * 60 * 1000; // 1 hour in milliseconds

  /**
   * Resolve a skill from skills.sh directory
   */
  private async resolveFromSkillsSh(identifier: string): Promise<ResolvedSkill> {
    try {
      // Fetch skills directory
      const skills = await this.fetchSkillsDirectory();
      
      // Search for matching skill (case-insensitive)
      const normalizedIdentifier = identifier.toLowerCase();
      const matches = skills.filter(skill => 
        skill.name.toLowerCase() === normalizedIdentifier ||
        skill.name.toLowerCase().includes(normalizedIdentifier)
      );
      
      if (matches.length === 0) {
        const error = new SkillResolutionError(
          `Skill "${identifier}" not found in skills.sh directory`,
          identifier,
          ['Try using owner/repo format instead', 'Search skills.sh for available skills'],
          { searchedIn: 'skills.sh', totalSkills: skills.length }
        );
        ErrorLogger.log(error);
        throw error;
      }
      
      if (matches.length > 1) {
        const exactMatch = matches.find(s => s.name.toLowerCase() === normalizedIdentifier);
        if (exactMatch) {
          return this.skillShEntryToResolvedSkill(exactMatch);
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
      }
      
      // Single match found
      return this.skillShEntryToResolvedSkill(matches[0]);
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
        trending: false // Will be set by getLeaderboard if needed
      }
    };
  }

  /**
   * Fetch and cache the skills directory from skills.sh
   */
  private async fetchSkillsDirectory(): Promise<SkillShEntry[]> {
    // Check cache
    if (this.skillsCache && (Date.now() - this.skillsCache.timestamp) < this.CACHE_TTL) {
      return this.skillsCache.data;
    }
    
    try {
      // Fetch the skills.sh homepage HTML
      const response = await fetch('https://skills.sh');
      if (!response.ok) {
        const error = new NetworkError(
          'Failed to fetch skills.sh directory',
          'https://skills.sh',
          { 
            statusCode: response.status,
            context: { statusText: response.statusText }
          }
        );
        ErrorLogger.log(error);
        throw error;
      }
      
      const html = await response.text();
      
      // Parse skills from HTML
      const skills = this.parseSkillsFromHTML(html);
      
      // Update cache
      this.skillsCache = {
        data: skills,
        timestamp: Date.now()
      };
      
      return skills;
    } catch (error) {
      // If cache exists but is stale, return it anyway
      if (this.skillsCache) {
        console.warn('Failed to fetch fresh skills.sh data, using stale cache:', error);
        return this.skillsCache.data;
      }
      
      // Wrap and re-throw if not already a NetworkError
      if (error instanceof NetworkError) {
        throw error;
      }
      
      const wrappedError = new NetworkError(
        'Failed to fetch skills.sh directory',
        'https://skills.sh',
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
   * Parse skills from skills.sh HTML
   * Extracts skill entries from the leaderboard
   */
  private parseSkillsFromHTML(html: string): SkillShEntry[] {
    const skills: SkillShEntry[] = [];
    
    // Match skill entries in the HTML
    // Pattern: href="/owner/repo/skill-name" with install count
    const skillPattern = /<a[^>]*href="\/([^/]+)\/([^/]+)\/([^"]+)"[^>]*>[\s\S]*?<h3[^>]*>([^<]+)<\/h3>[\s\S]*?<p[^>]*>([^<]+)<\/p>[\s\S]*?<span[^>]*>([^<]+)<\/span>/g;
    
    let match;
    while ((match = skillPattern.exec(html)) !== null) {
      const [, owner, repo, skillName, displayName, repoPath, installsStr] = match;
      
      // Parse install count (e.g., "30.4K" -> 30400)
      const installs = this.parseInstallCount(installsStr);
      
      skills.push({
        name: skillName,
        owner,
        repo,
        installs,
        description: `${displayName} from ${repoPath}`,
        metadata: {
          trending: false
        }
      });
    }
    
    // If the above pattern doesn't work, try a simpler pattern
    if (skills.length === 0) {
      // Fallback: extract from href patterns
      const hrefPattern = /href="\/([^/]+)\/([^/]+)\/([^"]+)"/g;
      const installPattern = /<span[^>]*font-mono[^>]*>([0-9.KM]+)<\/span>/g;
      
      const hrefs: Array<{owner: string; repo: string; name: string}> = [];
      while ((match = hrefPattern.exec(html)) !== null) {
        const [, owner, repo, name] = match;
        // Skip non-skill links
        if (owner && repo && name && !name.includes('?') && !name.includes('#')) {
          hrefs.push({ owner, repo, name });
        }
      }
      
      const installCounts: number[] = [];
      while ((match = installPattern.exec(html)) !== null) {
        installCounts.push(this.parseInstallCount(match[1]));
      }
      
      // Match hrefs with install counts
      for (let i = 0; i < Math.min(hrefs.length, installCounts.length); i++) {
        const { owner, repo, name } = hrefs[i];
        skills.push({
          name,
          owner,
          repo,
          installs: installCounts[i],
          description: `${name} from ${owner}/${repo}`,
          metadata: {
            trending: false
          }
        });
      }
    }
    
    return skills;
  }

  /**
   * Parse install count string to number
   * 
   * Converts human-readable install counts to numeric values.
   * Examples: "30.4K" -> 30400, "1.5M" -> 1500000, "973" -> 973
   * 
   * @param str - Install count string (e.g., "30.4K", "1.5M", "973")
   * @returns Numeric install count
   */
  private parseInstallCount(str: string): number {
    const cleaned = str.trim();
    
    // Handle thousands (K suffix)
    if (cleaned.endsWith('K')) {
      return Math.floor(parseFloat(cleaned.slice(0, -1)) * 1000);
    }
    
    // Handle millions (M suffix)
    if (cleaned.endsWith('M')) {
      return Math.floor(parseFloat(cleaned.slice(0, -1)) * 1000000);
    }
    
    // Handle plain numbers
    return parseInt(cleaned, 10) || 0;
  }

  /**
   * Search skills.sh for skills matching a query
   */
  async searchSkillsSh(query: string): Promise<SkillShEntry[]> {
    const skills = await this.fetchSkillsDirectory();
    const normalizedQuery = query.toLowerCase();
    
    return skills.filter(skill => 
      skill.name.toLowerCase().includes(normalizedQuery) ||
      (skill.description && skill.description.toLowerCase().includes(normalizedQuery)) ||
      skill.owner.toLowerCase().includes(normalizedQuery) ||
      skill.repo.toLowerCase().includes(normalizedQuery)
    );
  }

  /**
   * Get the leaderboard from skills.sh
   */
  async getLeaderboard(timeframe: 'all' | '24h' = 'all'): Promise<SkillShEntry[]> {
    try {
      // Fetch appropriate page
      const url = timeframe === '24h' ? 'https://skills.sh/trending' : 'https://skills.sh';
      const response = await fetch(url);
      
      if (!response.ok) {
        const error = new NetworkError(
          'Failed to fetch leaderboard',
          url,
          { 
            statusCode: response.status,
            context: { statusText: response.statusText, timeframe }
          }
        );
        ErrorLogger.log(error);
        throw error;
      }
      
      const html = await response.text();
      const skills = this.parseSkillsFromHTML(html);
      
      // Mark trending skills
      if (timeframe === '24h') {
        skills.forEach(skill => {
          if (skill.metadata) {
            skill.metadata.trending = true;
          }
        });
      }
      
      return skills;
    } catch (error) {
      if (error instanceof NetworkError) {
        throw error;
      }
      const wrappedError = new NetworkError(
        'Failed to fetch leaderboard',
        timeframe === '24h' ? 'https://skills.sh/trending' : 'https://skills.sh',
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
}
