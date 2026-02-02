/**
 * Skill Fetcher
 * 
 * Fetches skill content from GitHub repositories.
 */

import { SkillContent, ResolvedSkill } from './types.js';
import { NetworkError, ErrorLogger } from './errors.js';

export class SkillFetcher {
  private readonly githubRawBaseUrl = 'https://raw.githubusercontent.com';
  private readonly defaultBranches = ['main', 'master', 'HEAD'];
  private readonly maxRetries = 3;
  private readonly retryDelayMs = 1000;

  /**
   * Fetch skill content from GitHub
   * 
   * Constructs GitHub raw URL from ResolvedSkill, tries multiple branches,
   * and returns SkillContent with raw markdown, URL, and timestamp.
   * 
   * Requirements: 2.1, 2.4, 2.5
   */
  async fetchSkill(resolved: ResolvedSkill): Promise<SkillContent> {
    const { owner, repo, skillPath } = resolved;
    const triedBranches: string[] = [];
    let lastError: Error | null = null;
    
    // Try each branch until we find the skill
    for (const branch of this.defaultBranches) {
      const url = this.constructGitHubRawUrl(owner, repo, branch, skillPath);
      triedBranches.push(branch);
      
      try {
        const content = await this.fetchWithRetry(url);
        
        return {
          raw: content,
          url,
          fetchedAt: new Date(),
          source: resolved
        };
      } catch (error) {
        lastError = error as Error;
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        // If this is a 404, try the next branch without retrying
        if (errorMessage.includes('404') || error instanceof NetworkError && error.statusCode === 404) {
          if (branch === this.defaultBranches[this.defaultBranches.length - 1]) {
            const notFoundError = new NetworkError(
              `Skill not found at ${owner}/${repo}/${skillPath}`,
              url,
              {
                statusCode: 404,
                context: {
                  triedBranches,
                  suggestion: 'Verify the skill name and repository are correct'
                }
              }
            );
            ErrorLogger.log(notFoundError);
            throw notFoundError;
          }
          continue;
        }
        
        // For other errors, if this is the last branch, throw the error
        if (branch === this.defaultBranches[this.defaultBranches.length - 1]) {
          if (error instanceof NetworkError) {
            throw error;
          }
          const fetchError = new NetworkError(
            `Failed to fetch skill from ${owner}/${repo}/${skillPath}`,
            url,
            {
              context: {
                triedBranches,
                lastError: errorMessage
              }
            }
          );
          ErrorLogger.log(fetchError);
          throw fetchError;
        }
        // Otherwise, continue to the next branch
      }
    }
    
    // This should never be reached due to the throw in the loop
    const fallbackError = new NetworkError(
      `Failed to fetch skill from ${owner}/${repo}/${skillPath}`,
      resolved.fullUrl,
      {
        context: {
          triedBranches,
          lastError: lastError?.message || 'Unknown error'
        }
      }
    );
    ErrorLogger.log(fallbackError);
    throw fallbackError;
  }

  /**
   * Construct GitHub raw URL for skill content
   * 
   * Builds a URL following the pattern:
   * https://raw.githubusercontent.com/{owner}/{repo}/{branch}/{skillPath}/SKILL.md
   * 
   * @param owner - Repository owner (e.g., "anthropics")
   * @param repo - Repository name (e.g., "skills")
   * @param branch - Branch name (e.g., "main", "master")
   * @param skillPath - Path to skill directory (e.g., "skills/pdf")
   * @returns Complete GitHub raw content URL
   */
  private constructGitHubRawUrl(
    owner: string,
    repo: string,
    branch: string,
    skillPath: string
  ): string {
    // Ensure skillPath doesn't start with a slash to avoid double slashes in URL
    const cleanPath = skillPath.startsWith('/') ? skillPath.slice(1) : skillPath;
    
    // Construct the URL following GitHub's raw content URL pattern
    return `${this.githubRawBaseUrl}/${owner}/${repo}/${branch}/${cleanPath}/SKILL.md`;
  }

  /**
   * Fetch with retry logic and exponential backoff
   * 
   * Retries up to 3 times on network errors with exponential backoff (1s, 2s, 4s).
   * Does NOT retry on 404 errors (file not found).
   * 
   * Requirements: 2.5
   */
  private async fetchWithRetry(url: string): Promise<string> {
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        // Use the MCP fetch tool (simulated here - in real implementation this would call the MCP tool)
        const response = await this.fetchUrl(url);
        return response;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        // Don't retry on 404 errors - the file doesn't exist
        if (lastError.message.includes('404')) {
          const notFoundError = new NetworkError(
            'Resource not found',
            url,
            {
              statusCode: 404,
              retryCount: attempt,
              context: { message: 'The requested skill file does not exist' }
            }
          );
          ErrorLogger.log(notFoundError);
          throw notFoundError;
        }
        
        // If this is not the last attempt, wait before retrying
        if (attempt < this.maxRetries - 1) {
          const delay = this.retryDelayMs * Math.pow(2, attempt); // Exponential backoff: 1s, 2s, 4s
          console.log(`Retry attempt ${attempt + 1}/${this.maxRetries} after ${delay}ms delay...`);
          await this.sleep(delay);
        }
      }
    }
    
    // All retries exhausted
    const networkError = new NetworkError(
      `Failed to fetch after ${this.maxRetries} attempts`,
      url,
      {
        retryCount: this.maxRetries,
        context: {
          lastError: lastError?.message || 'Unknown error',
          suggestion: 'Check your internet connection and try again'
        }
      }
    );
    ErrorLogger.log(networkError);
    throw networkError;
  }

  /**
   * Fetch URL using MCP fetch tool
   * 
   * In a real implementation, this would call the MCP fetch tool.
   * For now, this is a placeholder that uses native fetch.
   */
  private async fetchUrl(url: string): Promise<string> {
    try {
      // TODO: Replace with actual MCP tool call
      // For now, use native fetch as a placeholder
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new NetworkError(
          `HTTP ${response.status}: ${response.statusText}`,
          url,
          {
            statusCode: response.status,
            context: { statusText: response.statusText }
          }
        );
      }
      
      return await response.text();
    } catch (error) {
      if (error instanceof NetworkError) {
        throw error;
      }
      
      // Wrap fetch errors
      const networkError = new NetworkError(
        'Failed to fetch URL',
        url,
        {
          context: {
            originalError: error instanceof Error ? error.message : String(error)
          }
        }
      );
      ErrorLogger.log(networkError);
      throw networkError;
    }
  }

  /**
   * Sleep for a specified number of milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
