/**
 * List Skills Tool
 *
 * Lists all available skills from skills.sh with pagination.
 * Requires SKILLS_SH_API_KEY environment variable for the v1 paginated API.
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
 * Requires SKILLS_SH_API_KEY to use the paginated /api/v1/skills endpoint.
 * Without an API key, returns an error directing users to use search_skills instead.
 *
 * @param args - Pagination parameters (page, pageSize)
 * @returns Paginated list of skills with metadata
 */
export async function listSkillsHandler(args: ListSkillsArgs): Promise<ListSkillsResult> {
  const resolver = new SkillResolver();

  const page = args.page || 1;
  const pageSize = Math.min(args.pageSize || 50, 100);

  // Use the authenticated v1 API (throws if no API key)
  const { skills: allSkills, total } = await resolver.listSkills(page, pageSize);

  // Format skills for output
  const skills = allSkills.map(skill => ({
    name: skill.name,
    description: skill.description || '',
    owner: skill.owner,
    repo: skill.repo,
    installs: skill.installs,
  }));

  return {
    skills,
    total,
    page,
    pageSize,
  };
}
