/**
 * Fetch Skill Tool
 * 
 * Fetches raw skill content from GitHub
 */

import { SkillResolver } from '../core/skill-resolver.js';
import { SkillFetcher } from '../core/skill-fetcher.js';

export interface FetchSkillArgs {
  identifier: string;
}

export interface FetchSkillResult {
  content: string;
  url: string;
  metadata: {
    name: string;
    owner: string;
    repo: string;
    skillPath: string;
    fetchedAt: string;
  };
}

/**
 * Fetch skill content from GitHub
 * 
 * Resolves the skill identifier to a GitHub URL and fetches the content.
 * Tries multiple branches (main, master, HEAD) with retry logic.
 * 
 * @param args - Fetch parameters (identifier)
 * @returns Skill content with metadata
 */
export async function fetchSkillHandler(args: FetchSkillArgs): Promise<FetchSkillResult> {
  if (!args.identifier || args.identifier.trim().length === 0) {
    throw new Error('Skill identifier is required');
  }
  
  const resolver = new SkillResolver();
  const fetcher = new SkillFetcher();
  
  // Resolve identifier to GitHub URL
  const resolved = await resolver.resolve(args.identifier);
  
  // Fetch content
  const content = await fetcher.fetchSkill(resolved);
  
  // Extract skill name from path
  const skillName = resolved.skillPath.split('/').pop() || args.identifier;
  
  return {
    content: content.raw,
    url: content.url,
    metadata: {
      name: skillName,
      owner: resolved.owner,
      repo: resolved.repo,
      skillPath: resolved.skillPath,
      fetchedAt: content.fetchedAt.toISOString(),
    },
  };
}
