/**
 * Convert to Steering Tool
 * 
 * Converts skill to Kiro steering file format
 */

import { ConversionEngine } from '../core/conversion-engine.js';

export interface ConvertToSteeringArgs {
  content: string;
  sourceUrl?: string;
}

export interface ConvertToSteeringResult {
  steeringContent: string;
  filename: string;
  metadata: {
    originalSkill: string;
    sourceUrl: string;
    importedAt: string;
  };
}

/**
 * Convert skill to Kiro steering file format
 * 
 * Parses the skill content and converts it to a steering file with
 * appropriate frontmatter and preserved content.
 * 
 * @param args - Conversion parameters (content, sourceUrl)
 * @returns Steering file content and metadata
 */
export async function convertToSteeringHandler(
  args: ConvertToSteeringArgs
): Promise<ConvertToSteeringResult> {
  if (!args.content || args.content.trim().length === 0) {
    throw new Error('Skill content is required');
  }
  
  const engine = new ConversionEngine();
  
  // Parse skill
  const parsed = engine.parseSkill(args.content);
  
  // Convert to steering file
  const steering = engine.toSteeringFile(parsed, args.sourceUrl || 'unknown');
  
  return {
    steeringContent: steering.content,
    filename: steering.filename,
    metadata: {
      originalSkill: steering.metadata.originalSkill,
      sourceUrl: steering.metadata.sourceUrl,
      importedAt: steering.metadata.importedAt.toISOString(),
    },
  };
}
