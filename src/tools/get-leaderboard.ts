/**
 * Get Leaderboard Tool
 *
 * Gets trending or top-installed skills from skills.sh.
 * Requires SKILLS_SH_API_KEY environment variable for the v1 API.
 */

import { SkillResolver } from '../core/skill-resolver.js';

export interface GetLeaderboardArgs {
  timeframe?: 'all' | '24h';
  limit?: number;
}

export interface GetLeaderboardResult {
  skills: Array<{
    name: string;
    description: string;
    owner: string;
    repo: string;
    installs: number;
    rank: number;
    trending?: boolean;
  }>;
  timeframe: string;
  count: number;
}

/**
 * Get the leaderboard from skills.sh
 *
 * Requires SKILLS_SH_API_KEY to use the /api/v1/skills endpoint with view=trending or view=all-time.
 * Without an API key, returns an error directing users to use search_skills instead.
 *
 * @param args - Leaderboard parameters (timeframe, limit)
 * @returns Leaderboard skills with rankings
 */
export async function getLeaderboardHandler(args: GetLeaderboardArgs): Promise<GetLeaderboardResult> {
  const resolver = new SkillResolver();

  const timeframe = args.timeframe || 'all';
  const limit = Math.min(args.limit || 20, 50);

  // Use the authenticated v1 API (throws if no API key)
  const leaderboard = await resolver.getLeaderboard(timeframe, limit);

  // Format skills for output with rank
  const skills = leaderboard.map((skill, index) => ({
    name: skill.name,
    description: skill.description || '',
    owner: skill.owner,
    repo: skill.repo,
    installs: skill.installs,
    rank: index + 1,
    trending: skill.metadata?.trending || false,
  }));

  return {
    skills,
    timeframe,
    count: leaderboard.length,
  };
}
