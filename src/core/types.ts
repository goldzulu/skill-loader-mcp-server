/**
 * Type definitions for the Skill Loader MCP Server
 */

// Skill Resolver Types
export interface ResolvedSkill {
  owner: string;
  repo: string;
  skillPath: string;
  fullUrl: string;
  source: 'skills.sh' | 'github';
  metadata?: SkillShMetadata;
}

export interface SkillShEntry {
  name: string;
  owner: string;
  repo: string;
  installs: number;
  description?: string;
  id?: string;
  skillId?: string;
  source?: string;
  metadata?: {
    trending?: boolean;
  };
}

export interface SkillShMetadata {
  installs: number;
  trending: boolean;
  rank?: number;
}

// skills.sh API response types
export interface SkillsShSearchResponse {
  query: string;
  searchType: string;
  skills: SkillsShSearchEntry[];
  count: number;
  duration_ms: number;
}

export interface SkillsShSearchEntry {
  id: string;
  skillId: string;
  name: string;
  installs: number;
  source: string;
}

export interface SkillsShV1Response {
  skills: SkillsShV1Entry[];
  total: number;
  offset: number;
  limit: number;
}

export interface SkillsShV1Entry {
  id: string;
  name: string;
  owner: string;
  repo: string;
  installs: number;
  description?: string;
  trending?: boolean;
}

// Skill Fetcher Types
export interface SkillContent {
  raw: string;
  url: string;
  fetchedAt: Date;
  source: ResolvedSkill;
}

// Security Validator Types
export interface ValidationResult {
  isValid: boolean;
  issues: SecurityIssue[];
  severity: 'safe' | 'warning' | 'unsafe';
}

export interface SecurityIssue {
  type: 'dangerous_command' | 'suspicious_pattern' | 'untrusted_source';
  description: string;
  location: string;
}

// Conversion Engine Types
export interface ParsedSkill {
  frontmatter: SkillFrontmatter;
  body: string;
  sections: SkillSection[];
}

export interface SkillFrontmatter {
  name: string;
  description: string;
  dependencies?: string[];
  [key: string]: any;
}

export interface SkillSection {
  heading: string;
  content: string;
  level: number;
}

export interface SteeringFile {
  filename: string;
  content: string;
  metadata: SteeringMetadata;
}

export interface SteeringMetadata {
  originalSkill: string;
  sourceUrl: string;
  importedAt: Date;
}

export interface PowerStructure {
  powerName: string;
  files: PowerFile[];
}

export interface PowerFile {
  path: string;
  content: string;
}
