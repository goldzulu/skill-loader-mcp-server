/**
 * Get Leaderboard Tool
 * 
 * Gets trending or top-installed skills from skills.sh
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
 * Fetches either the all-time leaderboard or 24-hour trending skills.
 * Returns skills sorted by install count or trending score.
 * 
 * @param args - Leaderboard parameters (timeframe, limit)
 * @returns Leaderboard skills with rankings
 */
export async function getLeaderboardHandler(args: GetLeaderboardArgs): Promise<GetLeaderboardResult> {
  const resolver = new SkillResolver();
  
  // Fetch leaderboard
  const timeframe = args.timeframe || 'all';
  const leaderboard = await resolver.getLeaderboard(timeframe);
  
  // Apply limit
  const limit = Math.min(args.limit || 20, 50);
  const limitedResults = leaderboard.slice(0, limit);
  
  // Format skills for output with rank
  const skills = limitedResults.map((skill, index) => ({
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
