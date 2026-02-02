/**
 * Search Skills Tool
 * 
 * Searches for skills by keyword in name or description
 */

import { SkillResolver } from '../core/skill-resolver.js';

export interface SearchSkillsArgs {
  query: string;
  limit?: number;
}

export interface SearchSkillsResult {
  skills: Array<{
    name: string;
    description: string;
    owner: string;
    repo: string;
    installs: number;
    relevance: number;
  }>;
  query: string;
  count: number;
}

/**
 * Search for skills by keyword
 * 
 * Searches the skills.sh directory for skills matching the query.
 * Returns results sorted by relevance (install count).
 * 
 * @param args - Search parameters (query, limit)
 * @returns Matching skills sorted by relevance
 */
export async function searchSkillsHandler(args: SearchSkillsArgs): Promise<SearchSkillsResult> {
  if (!args.query || args.query.trim().length === 0) {
    throw new Error('Search query is required');
  }
  
  const resolver = new SkillResolver();
  
  // Search skills.sh
  const results = await resolver.searchSkillsSh(args.query);
  
  // Sort by install count (relevance)
  results.sort((a, b) => b.installs - a.installs);
  
  // Apply limit
  const limit = Math.min(args.limit || 20, 50);
  const limitedResults = results.slice(0, limit);
  
  // Format skills for output with relevance score
  const skills = limitedResults.map((skill, index) => ({
    name: skill.name,
    description: skill.description || '',
    owner: skill.owner,
    repo: skill.repo,
    installs: skill.installs,
    relevance: results.length - index, // Higher rank = higher relevance
  }));
  
  return {
    skills,
    query: args.query,
    count: results.length,
  };
}
