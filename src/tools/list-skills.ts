/**
 * List Skills Tool
 * 
 * Lists all available skills from skills.sh with pagination
 */

import { SkillResolver } from '../core/skill-resolver.js';

export interface ListSkillsArgs {
  page?: number;
  pageSize?: number;
}

export interface ListSkillsResult {
  skills: Array<{
    name: string;
    description: string;
    owner: string;
    repo: string;
    installs: number;
  }>;
  total: number;
  page: number;
  pageSize: number;
}

/**
 * List all available skills from skills.sh
 * 
 * Fetches the skills directory and returns paginated results.
 * Caches the directory for 1 hour to reduce API calls.
 * 
 * @param args - Pagination parameters (page, pageSize)
 * @returns Paginated list of skills with metadata
 */
export async function listSkillsHandler(args: ListSkillsArgs): Promise<ListSkillsResult> {
  const resolver = new SkillResolver();
  
  // Fetch all skills from leaderboard
  const leaderboard = await resolver.getLeaderboard('all');
  
  // Apply pagination
  const page = args.page || 1;
  const pageSize = Math.min(args.pageSize || 50, 100);
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  
  // Extract paginated skills
  const paginatedSkills = leaderboard.slice(start, end);
  
  // Format skills for output
  const skills = paginatedSkills.map(skill => ({
    name: skill.name,
    description: skill.description || '',
    owner: skill.owner,
    repo: skill.repo,
    installs: skill.installs,
  }));
  
  return {
    skills,
    total: leaderboard.length,
    page,
    pageSize,
  };
}
