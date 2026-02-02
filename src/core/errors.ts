/**
 * Custom Error Classes for Skill Loader
 * 
 * Provides specific error types for different failure scenarios
 * with detailed context and recovery suggestions.
 * 
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5
 */

/**
 * Base error class for all Skill Loader errors
 */
export class SkillLoaderError extends Error {
  public readonly timestamp: Date;
  public readonly context: Record<string, any>;

  constructor(message: string, context: Record<string, any> = {}) {
    super(message);
    this.name = this.constructor.name;
    this.timestamp = new Date();
    this.context = context;
    
    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Get a formatted error message with context
   */
  getDetailedMessage(): string {
    let msg = `[${this.timestamp.toISOString()}] ${this.name}: ${this.message}`;
    
    if (Object.keys(this.context).length > 0) {
      msg += '\nContext: ' + JSON.stringify(this.context, null, 2);
    }
    
    if (this.stack) {
      msg += '\n' + this.stack;
    }
    
    return msg;
  }
}

/**
 * Network-related errors (connection, timeout, HTTP errors)
 * Requirement 8.2
 */
export class NetworkError extends SkillLoaderError {
  public readonly url: string;
  public readonly statusCode?: number;
  public readonly retryCount: number;

  constructor(
    message: string,
    url: string,
    options: {
      statusCode?: number;
      retryCount?: number;
      context?: Record<string, any>;
    } = {}
  ) {
    super(message, {
      url,
      statusCode: options.statusCode,
      retryCount: options.retryCount,
      ...options.context
    });
    this.url = url;
    this.statusCode = options.statusCode;
    this.retryCount = options.retryCount || 0;
  }

  /**
   * Get user-friendly error message with recovery suggestions
   */
  getUserMessage(): string {
    let msg = `Network Error: ${this.message}\n`;
    msg += `URL: ${this.url}\n`;
    
    if (this.statusCode) {
      msg += `Status Code: ${this.statusCode}\n`;
    }
    
    if (this.retryCount > 0) {
      msg += `Retried ${this.retryCount} time(s)\n`;
    }
    
    // Add recovery suggestions based on error type
    if (this.statusCode === 404) {
      msg += '\nSuggestions:\n';
      msg += '- Verify the skill name is correct\n';
      msg += '- Check if the repository exists on GitHub\n';
      msg += '- Try using owner/repo format instead\n';
    } else if (this.statusCode === 403) {
      msg += '\nSuggestions:\n';
      msg += '- You may have hit GitHub rate limits\n';
      msg += '- Wait a few minutes and try again\n';
    } else if (this.statusCode && this.statusCode >= 500) {
      msg += '\nSuggestions:\n';
      msg += '- The server is experiencing issues\n';
      msg += '- Try again in a few minutes\n';
    } else {
      msg += '\nSuggestions:\n';
      msg += '- Check your internet connection\n';
      msg += '- Verify you can access GitHub\n';
      msg += '- Try again in a few moments\n';
    }
    
    return msg;
  }
}

/**
 * Validation errors (invalid format, missing fields, security issues)
 * Requirement 8.3
 */
export class ValidationError extends SkillLoaderError {
  public readonly validationType: 'format' | 'security' | 'schema' | 'content';
  public readonly lineNumber?: number;
  public readonly details: string[];

  constructor(
    message: string,
    validationType: 'format' | 'security' | 'schema' | 'content',
    options: {
      lineNumber?: number;
      details?: string[];
      context?: Record<string, any>;
    } = {}
  ) {
    super(message, {
      validationType,
      lineNumber: options.lineNumber,
      details: options.details,
      ...options.context
    });
    this.validationType = validationType;
    this.lineNumber = options.lineNumber;
    this.details = options.details || [];
  }

  /**
   * Get user-friendly error message with specific validation issues
   */
  getUserMessage(): string {
    let msg = `Validation Error: ${this.message}\n`;
    msg += `Type: ${this.validationType}\n`;
    
    if (this.lineNumber) {
      msg += `Line: ${this.lineNumber}\n`;
    }
    
    if (this.details.length > 0) {
      msg += '\nDetails:\n';
      this.details.forEach(detail => {
        msg += `  - ${detail}\n`;
      });
    }
    
    // Add recovery suggestions based on validation type
    if (this.validationType === 'security') {
      msg += '\nSuggestions:\n';
      msg += '- Review the skill content manually\n';
      msg += '- Contact the skill author about security concerns\n';
      msg += '- Use a different skill from a trusted source\n';
    } else if (this.validationType === 'format') {
      msg += '\nSuggestions:\n';
      msg += '- Verify the skill follows the Agent Skills standard\n';
      msg += '- Check if the YAML frontmatter is properly formatted\n';
      msg += '- Report the issue to the skill author\n';
    }
    
    return msg;
  }
}

/**
 * File system errors (permission denied, disk full, path not found)
 * Requirement 8.3
 */
export class FileSystemError extends SkillLoaderError {
  public readonly operation: 'read' | 'write' | 'delete' | 'access';
  public readonly filePath: string;
  public readonly systemError?: string;

  constructor(
    message: string,
    operation: 'read' | 'write' | 'delete' | 'access',
    filePath: string,
    options: {
      systemError?: string;
      context?: Record<string, any>;
    } = {}
  ) {
    super(message, {
      operation,
      filePath,
      systemError: options.systemError,
      ...options.context
    });
    this.operation = operation;
    this.filePath = filePath;
    this.systemError = options.systemError;
  }

  /**
   * Get user-friendly error message with clear file paths
   */
  getUserMessage(): string {
    let msg = `File System Error: ${this.message}\n`;
    msg += `Operation: ${this.operation}\n`;
    msg += `Path: ${this.filePath}\n`;
    
    if (this.systemError) {
      msg += `System Error: ${this.systemError}\n`;
    }
    
    // Add recovery suggestions based on error type
    if (this.systemError?.includes('EACCES') || this.systemError?.includes('EPERM')) {
      msg += '\nSuggestions:\n';
      msg += '- Check file permissions\n';
      msg += '- Ensure you have write access to the directory\n';
      msg += '- Try running with appropriate permissions\n';
    } else if (this.systemError?.includes('ENOSPC')) {
      msg += '\nSuggestions:\n';
      msg += '- Free up disk space\n';
      msg += '- Choose a different output location\n';
    } else if (this.systemError?.includes('ENOENT')) {
      msg += '\nSuggestions:\n';
      msg += '- Verify the directory exists\n';
      msg += '- Check the file path is correct\n';
    } else if (this.systemError?.includes('EEXIST')) {
      msg += '\nSuggestions:\n';
      msg += '- Use the --overwrite flag to replace existing files\n';
      msg += '- Choose a different name for the skill\n';
    }
    
    return msg;
  }
}

/**
 * Parsing errors (YAML syntax, markdown structure, invalid content)
 * Requirement 8.3
 */
export class ParsingError extends SkillLoaderError {
  public readonly parserType: 'yaml' | 'markdown' | 'json';
  public readonly lineNumber?: number;
  public readonly columnNumber?: number;
  public readonly snippet?: string;

  constructor(
    message: string,
    parserType: 'yaml' | 'markdown' | 'json',
    options: {
      lineNumber?: number;
      columnNumber?: number;
      snippet?: string;
      context?: Record<string, any>;
    } = {}
  ) {
    super(message, {
      parserType,
      lineNumber: options.lineNumber,
      columnNumber: options.columnNumber,
      snippet: options.snippet,
      ...options.context
    });
    this.parserType = parserType;
    this.lineNumber = options.lineNumber;
    this.columnNumber = options.columnNumber;
    this.snippet = options.snippet;
  }

  /**
   * Get user-friendly error message with line numbers and snippets
   */
  getUserMessage(): string {
    let msg = `Parsing Error: ${this.message}\n`;
    msg += `Parser: ${this.parserType}\n`;
    
    if (this.lineNumber) {
      msg += `Line: ${this.lineNumber}`;
      if (this.columnNumber) {
        msg += `, Column: ${this.columnNumber}`;
      }
      msg += '\n';
    }
    
    if (this.snippet) {
      msg += '\nCode Snippet:\n';
      msg += this.snippet + '\n';
    }
    
    msg += '\nSuggestions:\n';
    if (this.parserType === 'yaml') {
      msg += '- Check YAML syntax (indentation, colons, quotes)\n';
      msg += '- Ensure frontmatter is enclosed in --- markers\n';
      msg += '- Validate YAML at https://www.yamllint.com/\n';
    } else if (this.parserType === 'markdown') {
      msg += '- Verify markdown structure is valid\n';
      msg += '- Check for unclosed code blocks\n';
      msg += '- Ensure headers are properly formatted\n';
    }
    
    return msg;
  }
}

/**
 * Skill resolution errors (not found, ambiguous, invalid identifier)
 */
export class SkillResolutionError extends SkillLoaderError {
  public readonly identifier: string;
  public readonly suggestions: string[];

  constructor(
    message: string,
    identifier: string,
    suggestions: string[] = [],
    context: Record<string, any> = {}
  ) {
    super(message, { identifier, suggestions, ...context });
    this.identifier = identifier;
    this.suggestions = suggestions;
  }

  /**
   * Get user-friendly error message with suggestions
   */
  getUserMessage(): string {
    let msg = `Skill Resolution Error: ${this.message}\n`;
    msg += `Identifier: ${this.identifier}\n`;
    
    if (this.suggestions.length > 0) {
      msg += '\nDid you mean:\n';
      this.suggestions.forEach(suggestion => {
        msg += `  - ${suggestion}\n`;
      });
    }
    
    msg += '\nSuggestions:\n';
    msg += '- Try using owner/repo format (e.g., anthropics/skills/pdf)\n';
    msg += '- Search skills.sh for available skills\n';
    msg += '- Verify the skill name is correct\n';
    
    return msg;
  }
}

/**
 * Error logger utility
 * Requirement 8.5
 */
export class ErrorLogger {
  private static logs: Array<{
    timestamp: Date;
    errorType: string;
    message: string;
    context: Record<string, any>;
    stack?: string;
  }> = [];

  /**
   * Log an error with timestamp and context
   */
  static log(error: Error | SkillLoaderError): void {
    const logEntry = {
      timestamp: new Date(),
      errorType: error.name,
      message: error.message,
      context: error instanceof SkillLoaderError ? error.context : {},
      stack: error.stack
    };

    this.logs.push(logEntry);

    // Also log to console for debugging
    if (error instanceof SkillLoaderError) {
      console.error(error.getDetailedMessage());
    } else {
      console.error(`[${logEntry.timestamp.toISOString()}] ${error.name}: ${error.message}`);
      if (error.stack) {
        console.error(error.stack);
      }
    }
  }

  /**
   * Get all logged errors
   */
  static getLogs(): Array<{
    timestamp: Date;
    errorType: string;
    message: string;
    context: Record<string, any>;
    stack?: string;
  }> {
    return [...this.logs];
  }

  /**
   * Clear all logs
   */
  static clearLogs(): void {
    this.logs = [];
  }

  /**
   * Export logs to JSON string
   */
  static exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }
}
