/**
 * Import Skill Tool
 * 
 * Complete import workflow: fetch → validate → convert
 */

import { fetchSkillHandler } from './fetch-skill.js';
import { validateSkillHandler } from './validate-skill.js';
import { convertToSteeringHandler } from './convert-to-steering.js';
import { convertToPowerHandler } from './convert-to-power.js';
import { ValidationResult } from '../core/types.js';

export interface ImportSkillArgs {
  identifier: string;
  outputFormat: 'steering' | 'power';
  skipValidation?: boolean;
}

export interface ImportSkillResult {
  success: boolean;
  content: string;
  filename: string;
  targetPath: string;
  metadata: {
    skillName: string;
    sourceUrl: string;
    outputFormat: string;
    validationResult?: ValidationResult;
  };
  error?: string;
}

/**
 * Import a skill with complete workflow
 * 
 * Executes the complete import workflow:
 * 1. Fetch skill from GitHub
 * 2. Validate security (unless skipped)
 * 3. Convert to target format
 * 
 * @param args - Import parameters (identifier, outputFormat, skipValidation)
 * @returns Import result with content and metadata
 */
export async function importSkillHandler(args: ImportSkillArgs): Promise<ImportSkillResult> {
  try {
    // Validate arguments
    if (!args.identifier || args.identifier.trim().length === 0) {
      throw new Error('Skill identifier is required');
    }
    
    if (!args.outputFormat || !['steering', 'power'].includes(args.outputFormat)) {
      throw new Error('Output format must be "steering" or "power"');
    }
    
    // Step 1: Fetch skill
    const fetchResult = await fetchSkillHandler({ identifier: args.identifier });
    
    // Step 2: Validate (unless skipped)
    let validationResult: ValidationResult | undefined;
    if (!args.skipValidation) {
      validationResult = await validateSkillHandler({
        content: fetchResult.content,
        url: fetchResult.url,
      });
      
      // Block import if validation fails
      if (!validationResult.isValid) {
        return {
          success: false,
          content: '',
          filename: '',
          targetPath: '',
          metadata: {
            skillName: args.identifier,
            sourceUrl: fetchResult.url,
            outputFormat: args.outputFormat,
            validationResult,
          },
          error: `Security validation failed: ${validationResult.issues
            .map((i) => i.description)
            .join(', ')}`,
        };
      }
    }
    
    // Step 3: Convert to target format
    if (args.outputFormat === 'steering') {
      const convertResult = await convertToSteeringHandler({
        content: fetchResult.content,
        sourceUrl: fetchResult.url,
      });
      
      return {
        success: true,
        content: convertResult.steeringContent,
        filename: convertResult.filename,
        targetPath: `.kiro/steering/${convertResult.filename}`,
        metadata: {
          skillName: convertResult.metadata.originalSkill,
          sourceUrl: fetchResult.url,
          outputFormat: args.outputFormat,
          validationResult,
        },
      };
    } else {
      // outputFormat === 'power'
      const convertResult = await convertToPowerHandler({
        content: fetchResult.content,
        sourceUrl: fetchResult.url,
      });
      
      return {
        success: true,
        content: convertResult.powerContent,
        filename: 'POWER.md',
        targetPath: `~/.kiro/powers/${convertResult.powerName}/POWER.md`,
        metadata: {
          skillName: convertResult.powerName,
          sourceUrl: fetchResult.url,
          outputFormat: args.outputFormat,
          validationResult,
        },
      };
    }
  } catch (error) {
    return {
      success: false,
      content: '',
      filename: '',
      targetPath: '',
      metadata: {
        skillName: args.identifier,
        sourceUrl: '',
        outputFormat: args.outputFormat,
      },
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
