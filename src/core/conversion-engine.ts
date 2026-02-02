/**
 * Conversion Engine
 * 
 * Converts Claude skill format to Kiro formats (steering files and powers).
 */

import * as yaml from 'js-yaml';
import { ParsedSkill, SteeringFile, PowerStructure, SkillFrontmatter, SkillSection } from './types.js';
import { ParsingError, ValidationError, ErrorLogger } from './errors.js';

export class ConversionEngine {
  /**
   * Parse a Claude skill from raw markdown content
   * 
   * Extracts YAML frontmatter, parses it, and splits the markdown body into sections.
   * Preserves code blocks with language annotations.
   * 
   * @param content - Raw markdown content with YAML frontmatter
   * @returns ParsedSkill with frontmatter, body, and sections
   */
  parseSkill(content: string): ParsedSkill {
    try {
      if (!content || content.trim().length === 0) {
        const error = new ValidationError(
          'Skill content is empty',
          'content',
          { details: ['The skill file contains no content'] }
        );
        ErrorLogger.log(error);
        throw error;
      }

      // Extract YAML frontmatter using regex
      const frontmatterRegex = /^---\n([\s\S]*?)\n---/;
      const match = content.match(frontmatterRegex);
      
      let frontmatter: SkillFrontmatter;
      let body: string;
      
      if (match) {
        // Parse YAML frontmatter
        const yamlContent = match[1];
        try {
          const parsed = yaml.load(yamlContent);
          
          if (!parsed || typeof parsed !== 'object') {
            const error = new ParsingError(
              'YAML frontmatter is not a valid object',
              'yaml',
              { 
                snippet: yamlContent.split('\n').slice(0, 5).join('\n'),
                context: { yamlContent }
              }
            );
            ErrorLogger.log(error);
            throw error;
          }
          
          frontmatter = parsed as SkillFrontmatter;
          
          // Validate required fields
          if (!frontmatter.name) {
            const error = new ValidationError(
              'Skill frontmatter missing required field: name',
              'schema',
              { 
                details: ['The "name" field is required in skill frontmatter'],
                context: { frontmatter }
              }
            );
            ErrorLogger.log(error);
            throw error;
          }
          
          if (!frontmatter.description) {
            const error = new ValidationError(
              'Skill frontmatter missing required field: description',
              'schema',
              { 
                details: ['The "description" field is required in skill frontmatter'],
                context: { frontmatter }
              }
            );
            ErrorLogger.log(error);
            throw error;
          }
        } catch (error) {
          if (error instanceof ParsingError || error instanceof ValidationError) {
            throw error;
          }
          
          // Extract line number from YAML error if available
          let lineNumber: number | undefined;
          let snippet: string | undefined;
          
          if (error instanceof yaml.YAMLException) {
            lineNumber = error.mark?.line;
            if (lineNumber !== undefined) {
              const lines = yamlContent.split('\n');
              const start = Math.max(0, lineNumber - 2);
              const end = Math.min(lines.length, lineNumber + 3);
              snippet = lines.slice(start, end).join('\n');
            }
          }
          
          const parsingError = new ParsingError(
            'Failed to parse YAML frontmatter',
            'yaml',
            {
              lineNumber,
              snippet,
              context: {
                originalError: error instanceof Error ? error.message : String(error)
              }
            }
          );
          ErrorLogger.log(parsingError);
          throw parsingError;
        }
        
        // Extract body (everything after frontmatter)
        body = content.slice(match[0].length).trim();
      } else {
        // No frontmatter found, use defaults
        console.warn('No YAML frontmatter found in skill, using defaults');
        frontmatter = {
          name: 'Untitled Skill',
          description: 'No description provided'
        };
        body = content.trim();
      }
      
      // Split markdown body into sections by headers
      const sections = this.extractSections(body);
      
      return {
        frontmatter,
        body,
        sections
      };
    } catch (error) {
      // Re-throw if already our custom error
      if (error instanceof ParsingError || error instanceof ValidationError) {
        throw error;
      }
      
      // Wrap unexpected errors
      const wrappedError = new ParsingError(
        'Failed to parse skill content',
        'markdown',
        {
          context: {
            originalError: error instanceof Error ? error.message : String(error)
          }
        }
      );
      ErrorLogger.log(wrappedError);
      throw wrappedError;
    }
  }
  
  /**
   * Extract sections from markdown body by splitting on headers
   * 
   * Parses markdown content and splits it into logical sections based on headers.
   * Preserves code blocks with language annotations and handles nested structures.
   * 
   * Algorithm:
   * 1. Track code block state to avoid splitting on headers inside code blocks
   * 2. Detect headers (# through ######) when not in code blocks
   * 3. Group content under each header into sections
   * 4. Preserve all formatting, including code blocks and special characters
   * 
   * @param body - Markdown body content to parse
   * @returns Array of SkillSection objects with heading, content, and level
   */
  private extractSections(body: string): SkillSection[] {
    const sections: SkillSection[] = [];
    const lines = body.split('\n');
    
    let currentSection: SkillSection | null = null;
    let currentContent: string[] = [];
    let inCodeBlock = false;
    
    for (const line of lines) {
      // Track code block state to avoid splitting on headers inside code blocks
      // Code blocks start and end with ``` (triple backticks)
      if (line.trim().startsWith('```')) {
        inCodeBlock = !inCodeBlock;
      }
      
      // Check if line is a header (only when not in code block)
      // Headers match pattern: # Heading, ## Heading, etc.
      if (!inCodeBlock && line.match(/^(#{1,6})\s+(.+)/)) {
        // Save previous section if exists
        if (currentSection) {
          currentSection.content = currentContent.join('\n').trim();
          sections.push(currentSection);
        }
        
        // Start new section
        const headerMatch = line.match(/^(#{1,6})\s+(.+)/);
        if (headerMatch) {
          const level = headerMatch[1].length; // Number of # characters
          const heading = headerMatch[2].trim(); // Heading text
          
          currentSection = {
            heading,
            content: '',
            level
          };
          currentContent = [];
        }
      } else {
        // Add line to current section content
        currentContent.push(line);
      }
    }
    
    // Save last section
    if (currentSection) {
      currentSection.content = currentContent.join('\n').trim();
      sections.push(currentSection);
    } else if (currentContent.length > 0) {
      // If no headers found, create a single section with all content
      sections.push({
        heading: 'Content',
        content: currentContent.join('\n').trim(),
        level: 1
      });
    }
    
    return sections;
  }

  /**
   * Convert a parsed skill to a Kiro steering file
   * 
   * Creates a steering file with:
   * - Frontmatter containing metadata (original_skill, source_url, imported_at)
   * - Preserved skill content and formatting
   * - Import attribution footer
   * 
   * @param skill - Parsed skill to convert
   * @param sourceUrl - Optional source URL for attribution
   * @returns SteeringFile object with filename, content, and metadata
   */
  toSteeringFile(skill: ParsedSkill, sourceUrl: string = ''): SteeringFile {
    const now = new Date();
    
    // Generate filename from skill name (kebab-case)
    const filename = this.toKebabCase(skill.frontmatter.name) + '.md';
    
    // Create steering file frontmatter
    const steeringFrontmatter = {
      original_skill: skill.frontmatter.name,
      source_url: sourceUrl,
      imported_at: now.toISOString()
    };
    
    // Build the steering file content
    const frontmatterYaml = yaml.dump(steeringFrontmatter);
    
    // Construct the full content
    let content = `---\n${frontmatterYaml}---\n\n`;
    
    // Add skill name as main heading if not already present
    if (!skill.body.trim().startsWith('#')) {
      content += `# ${skill.frontmatter.name}\n\n`;
    }
    
    // Add description if present
    if (skill.frontmatter.description) {
      content += `${skill.frontmatter.description}\n\n`;
    }
    
    // Add the skill body (preserving all formatting)
    content += skill.body;
    
    // Add dependencies section if present
    if (skill.frontmatter.dependencies && skill.frontmatter.dependencies.length > 0) {
      content += `\n\n## Dependencies\n\n`;
      for (const dep of skill.frontmatter.dependencies) {
        content += `- ${dep}\n`;
      }
    }
    
    // Add import attribution footer
    content += `\n\n---\n*Imported from Claude Skills via Skill Loader Power*\n`;
    
    return {
      filename,
      content,
      metadata: {
        originalSkill: skill.frontmatter.name,
        sourceUrl,
        importedAt: now
      }
    };
  }
  
  /**
   * Convert a string to kebab-case format
   * 
   * Transforms any string into kebab-case (lowercase with hyphens).
   * This is the standard naming convention for Kiro powers and steering files.
   * 
   * Transformation rules:
   * 1. Convert to lowercase
   * 2. Replace spaces and underscores with hyphens
   * 3. Remove special characters (keep only a-z, 0-9, and hyphens)
   * 4. Collapse multiple consecutive hyphens into one
   * 5. Remove leading and trailing hyphens
   * 
   * Examples:
   * - "PDF Extractor" -> "pdf-extractor"
   * - "React_Best_Practices" -> "react-best-practices"
   * - "My Skill!!!" -> "my-skill"
   * 
   * @param str - String to convert
   * @returns Kebab-case string (lowercase with hyphens)
   */
  private toKebabCase(str: string): string {
    return str
      .trim()
      .toLowerCase()
      // Replace spaces and underscores with hyphens
      .replace(/[\s_]+/g, '-')
      // Remove special characters except hyphens
      .replace(/[^a-z0-9-]/g, '')
      // Remove multiple consecutive hyphens
      .replace(/-+/g, '-')
      // Remove leading/trailing hyphens
      .replace(/^-+|-+$/g, '');
  }

  /**
   * Convert a parsed skill to a Kiro power
   * 
   * Creates a complete power structure with:
   * - Kebab-case power name
   * - POWER.md with Kiro frontmatter (name, displayName, description, keywords, author)
   * - Preserved skill instructions in body
   * - Import metadata
   * 
   * @param skill - Parsed skill to convert
   * @param sourceUrl - Optional source URL for attribution
   * @returns PowerStructure with power name and files
   */
  toPower(skill: ParsedSkill, sourceUrl: string = ''): PowerStructure {
    // Generate kebab-case power name
    const powerName = this.toKebabCase(skill.frontmatter.name);
    
    // Extract keywords from description (simple approach: take first few meaningful words)
    const keywords = this.extractKeywords(skill.frontmatter.description);
    
    // Create Kiro POWER.md frontmatter
    const powerFrontmatter = {
      name: powerName,
      displayName: skill.frontmatter.name,
      description: skill.frontmatter.description,
      keywords: keywords,
      author: 'Imported from Claude Skills'
    };
    
    // Build POWER.md content
    const frontmatterYaml = yaml.dump(powerFrontmatter);
    let powerContent = `---\n${frontmatterYaml}---\n\n`;
    
    // Add skill name as main heading if not already present
    if (!skill.body.trim().startsWith('#')) {
      powerContent += `# ${skill.frontmatter.name}\n\n`;
    }
    
    // Preserve skill instructions in body
    powerContent += skill.body;
    
    // Add dependencies section if present
    if (skill.frontmatter.dependencies && skill.frontmatter.dependencies.length > 0) {
      powerContent += `\n\n## Dependencies\n\n`;
      for (const dep of skill.frontmatter.dependencies) {
        powerContent += `- ${dep}\n`;
      }
    }
    
    // Add import metadata
    const now = new Date();
    powerContent += `\n\n---\n\n## Import Metadata\n\n`;
    powerContent += `- **Original Skill**: ${skill.frontmatter.name}\n`;
    if (sourceUrl) {
      powerContent += `- **Source URL**: ${sourceUrl}\n`;
    }
    powerContent += `- **Imported At**: ${now.toISOString()}\n`;
    powerContent += `- **Imported Via**: Skill Loader Power\n`;
    
    // Return PowerStructure with files
    return {
      powerName,
      files: [
        {
          path: 'POWER.md',
          content: powerContent
        }
      ]
    };
  }
  
  /**
   * Extract keywords from a description string
   * 
   * Simple approach: extract meaningful words (3+ characters, not common words)
   * and return up to 5 keywords
   * 
   * @param description - Description text to extract keywords from
   * @returns Array of keyword strings
   */
  private extractKeywords(description: string): string[] {
    // Common words to filter out
    const stopWords = new Set([
      'the', 'and', 'for', 'with', 'this', 'that', 'from', 'into',
      'when', 'what', 'where', 'how', 'why', 'can', 'will', 'should',
      'would', 'could', 'has', 'have', 'had', 'are', 'was', 'were',
      'been', 'being', 'you', 'your', 'use', 'used', 'using'
    ]);
    
    // Extract words, filter, and take first 5
    const words = description
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ') // Remove special characters
      .split(/\s+/)
      .filter(word => 
        word.length >= 3 && 
        !stopWords.has(word) &&
        !/^\d+$/.test(word) // Filter out pure numbers
      );
    
    // Remove duplicates and take first 5
    const uniqueWords = Array.from(new Set(words));
    return uniqueWords.slice(0, 5);
  }
}
