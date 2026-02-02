/**
 * Validate Skill Tool
 * 
 * Validates skill content for security issues
 */

import { SecurityValidator } from '../core/security-validator.js';
import { ValidationResult } from '../core/types.js';

export interface ValidateSkillArgs {
  content: string;
  url?: string;
}

/**
 * Validate skill content for security issues
 * 
 * Scans the skill content for dangerous patterns, suspicious file operations,
 * and code injection attempts. Returns validation result with severity and issues.
 * 
 * @param args - Validation parameters (content, url)
 * @returns Validation result with issues and severity
 */
export async function validateSkillHandler(args: ValidateSkillArgs): Promise<ValidationResult> {
  if (!args.content || args.content.trim().length === 0) {
    throw new Error('Skill content is required');
  }
  
  const validator = new SecurityValidator();
  
  // Create skill content object for validation
  const skillContent = {
    raw: args.content,
    url: args.url || 'unknown',
    fetchedAt: new Date(),
    source: {
      owner: 'unknown',
      repo: 'unknown',
      skillPath: 'unknown',
      fullUrl: args.url || 'unknown',
      source: 'github' as const,
    },
  };
  
  // Validate and return result
  return validator.validate(skillContent);
}
