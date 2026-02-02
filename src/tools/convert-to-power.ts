/**
 * Convert to Power Tool
 * 
 * Converts skill to Kiro power format
 */

import { ConversionEngine } from '../core/conversion-engine.js';

export interface ConvertToPowerArgs {
  content: string;
  sourceUrl?: string;
}

export interface ConvertToPowerResult {
  powerContent: string;
  powerName: string;
  metadata: {
    originalSkill: string;
    sourceUrl: string;
    importedAt: string;
  };
}

/**
 * Convert skill to Kiro power format
 * 
 * Parses the skill content and converts it to a power with POWER.md
 * containing Kiro frontmatter and preserved instructions.
 * 
 * @param args - Conversion parameters (content, sourceUrl)
 * @returns Power content, name, and metadata
 */
export async function convertToPowerHandler(
  args: ConvertToPowerArgs
): Promise<ConvertToPowerResult> {
  if (!args.content || args.content.trim().length === 0) {
    throw new Error('Skill content is required');
  }
  
  const engine = new ConversionEngine();
  
  // Parse skill
  const parsed = engine.parseSkill(args.content);
  
  // Convert to power
  const power = engine.toPower(parsed, args.sourceUrl || 'unknown');
  
  return {
    powerContent: power.files[0].content, // POWER.md content
    powerName: power.powerName,
    metadata: {
      originalSkill: parsed.frontmatter.name,
      sourceUrl: args.sourceUrl || 'unknown',
      importedAt: new Date().toISOString(),
    },
  };
}
