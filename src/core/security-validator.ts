/**
 * Security Validator
 * 
 * Validates skill content for security issues before injection.
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5
 */

import { ValidationResult, SkillContent, SecurityIssue } from './types.js';
import { ValidationError, ErrorLogger } from './errors.js';

export class SecurityValidator {
  // Dangerous command patterns that should be flagged
  private static readonly DANGEROUS_PATTERNS = [
    { pattern: /rm\s+-rf/gi, description: 'Dangerous recursive delete command (rm -rf)' },
    { pattern: /\bsudo\s+/gi, description: 'Elevated privilege command (sudo)' },
    { pattern: /\beval\s*\(/gi, description: 'Code evaluation (eval)' },
    { pattern: /\bexec\s*\(/gi, description: 'Code execution (exec)' },
    { pattern: /curl[^|]*\|\s*(bash|sh)/gi, description: 'Piping curl output to shell' },
    { pattern: /wget[^|]*\|\s*(bash|sh)/gi, description: 'Piping wget output to shell' },
  ];

  // Suspicious file system operations
  private static readonly SUSPICIOUS_FILE_OPS = [
    { pattern: /\/etc\//gi, description: 'Access to system configuration directory (/etc/)' },
    { pattern: /\/usr\//gi, description: 'Access to system binaries directory (/usr/)' },
    { pattern: /\/bin\//gi, description: 'Access to system binaries directory (/bin/)' },
    { pattern: /~\/\./gi, description: 'Access to hidden files in home directory' },
  ];

  // Code injection patterns
  private static readonly CODE_INJECTION_PATTERNS = [
    { pattern: /\$\{[^}]+\}/g, description: 'Variable expansion pattern (${...})' },
    { pattern: /\$\([^)]+\)/g, description: 'Command substitution pattern ($(...)' },
  ];

  /**
   * Validate skill content for security issues
   * 
   * Checks for:
   * - Trusted source (https://raw.githubusercontent.com/)
   * - Dangerous commands (rm -rf, sudo, eval, exec)
   * - Suspicious file operations (/etc/, /usr/, /bin/)
   * - Code injection patterns (${...}, $(...))
   * 
   * @param content - The skill content to validate
   * @returns ValidationResult with issues and severity
   */
  validate(content: SkillContent): ValidationResult {
    const issues: SecurityIssue[] = [];

    // Requirement 3.4: Verify URL starts with https://raw.githubusercontent.com/
    if (!this.isUrlTrusted(content.url)) {
      issues.push({
        type: 'untrusted_source',
        description: 'Content does not originate from trusted GitHub domain',
        location: content.url,
      });
    }

    // Requirement 3.2, 3.5: Scan for dangerous patterns
    const dangerousIssues = this.scanForDangerousPatterns(content.raw);
    issues.push(...dangerousIssues);

    // Requirement 3.5: Scan for suspicious file operations
    const fileOpIssues = this.scanForSuspiciousFileOps(content.raw);
    issues.push(...fileOpIssues);

    // Requirement 3.5: Scan for code injection patterns
    const injectionIssues = this.scanForCodeInjection(content.raw);
    issues.push(...injectionIssues);

    // Determine severity based on issues found
    const severity = this.determineSeverity(issues);

    // Requirement 3.1, 3.3: Return validation result
    // isValid is true for 'safe' and 'warning', false only for 'unsafe'
    return {
      isValid: severity !== 'unsafe',
      issues,
      severity,
    };
  }

  /**
   * Check if the URL is from a trusted GitHub source
   * Requirement 3.4
   */
  private isUrlTrusted(url: string): boolean {
    return url.startsWith('https://raw.githubusercontent.com/');
  }

  /**
   * Scan content for dangerous command patterns
   * Requirement 3.2, 3.5
   */
  private scanForDangerousPatterns(content: string): SecurityIssue[] {
    const issues: SecurityIssue[] = [];

    for (const { pattern, description } of SecurityValidator.DANGEROUS_PATTERNS) {
      const matches = content.matchAll(pattern);
      for (const match of matches) {
        const lineNumber = this.getLineNumber(content, match.index || 0);
        issues.push({
          type: 'dangerous_command',
          description,
          location: `Line ${lineNumber}: ${match[0]}`,
        });
      }
    }

    return issues;
  }

  /**
   * Scan content for suspicious file system operations
   * Requirement 3.5
   */
  private scanForSuspiciousFileOps(content: string): SecurityIssue[] {
    const issues: SecurityIssue[] = [];

    for (const { pattern, description } of SecurityValidator.SUSPICIOUS_FILE_OPS) {
      const matches = content.matchAll(pattern);
      for (const match of matches) {
        const lineNumber = this.getLineNumber(content, match.index || 0);
        issues.push({
          type: 'suspicious_pattern',
          description,
          location: `Line ${lineNumber}: ${match[0]}`,
        });
      }
    }

    return issues;
  }

  /**
   * Scan content for code injection patterns
   * Requirement 3.5
   */
  private scanForCodeInjection(content: string): SecurityIssue[] {
    const issues: SecurityIssue[] = [];

    for (const { pattern, description } of SecurityValidator.CODE_INJECTION_PATTERNS) {
      const matches = content.matchAll(pattern);
      for (const match of matches) {
        const lineNumber = this.getLineNumber(content, match.index || 0);
        issues.push({
          type: 'suspicious_pattern',
          description,
          location: `Line ${lineNumber}: ${match[0]}`,
        });
      }
    }

    return issues;
  }

  /**
   * Determine severity level based on issues found
   * Requirement 3.3
   * 
   * Note: isValid is true for 'safe' and 'warning' levels, false only for 'unsafe'
   */
  private determineSeverity(issues: SecurityIssue[]): 'safe' | 'warning' | 'unsafe' {
    if (issues.length === 0) {
      return 'safe';
    }

    // If any untrusted source or dangerous command, mark as unsafe
    const hasUntrustedSource = issues.some(issue => issue.type === 'untrusted_source');
    const hasDangerousCommand = issues.some(issue => issue.type === 'dangerous_command');

    if (hasUntrustedSource || hasDangerousCommand) {
      return 'unsafe';
    }

    // Otherwise, suspicious patterns are warnings
    return 'warning';
  }

  /**
   * Get line number from character index in content
   */
  private getLineNumber(content: string, index: number): number {
    const lines = content.substring(0, index).split('\n');
    return lines.length;
  }
}
