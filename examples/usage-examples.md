# Skill Loader MCP Server - Usage Examples

This document provides examples of how to use the Skill Loader MCP Server tools.

## Tool Examples

### 1. List Skills

List all available skills from skills.sh with pagination:

```json
{
  "tool": "list_skills",
  "arguments": {
    "page": 1,
    "pageSize": 10
  }
}
```

**Response:**
```json
{
  "skills": [
    {
      "name": "pdf-extractor",
      "description": "Extract text from PDF files",
      "owner": "anthropics",
      "repo": "skills",
      "installs": 30400
    }
  ],
  "total": 150,
  "page": 1,
  "pageSize": 10
}
```

### 2. Search Skills

Search for skills by keyword:

```json
{
  "tool": "search_skills",
  "arguments": {
    "query": "pdf",
    "limit": 5
  }
}
```

**Response:**
```json
{
  "skills": [
    {
      "name": "pdf-extractor",
      "description": "Extract text from PDF files",
      "owner": "anthropics",
      "repo": "skills",
      "installs": 30400,
      "relevance": 5
    }
  ],
  "query": "pdf",
  "count": 5
}
```

### 3. Get Leaderboard

Get trending or top-installed skills:

```json
{
  "tool": "get_leaderboard",
  "arguments": {
    "timeframe": "24h",
    "limit": 10
  }
}
```

**Response:**
```json
{
  "skills": [
    {
      "name": "pdf-extractor",
      "description": "Extract text from PDF files",
      "owner": "anthropics",
      "repo": "skills",
      "installs": 30400,
      "rank": 1,
      "trending": true
    }
  ],
  "timeframe": "24h",
  "count": 10
}
```

### 4. Fetch Skill

Fetch raw skill content from GitHub:

```json
{
  "tool": "fetch_skill",
  "arguments": {
    "identifier": "anthropics/pdf-extractor"
  }
}
```

**Response:**
```json
{
  "content": "---\nname: PDF Extractor\ndescription: Extract text from PDF files\n---\n\n# PDF Extractor\n\n...",
  "url": "https://raw.githubusercontent.com/anthropics/skills/main/skills/pdf-extractor/SKILL.md",
  "metadata": {
    "name": "pdf-extractor",
    "owner": "anthropics",
    "repo": "skills",
    "skillPath": "skills/pdf-extractor",
    "fetchedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### 5. Validate Skill

Validate skill content for security issues:

```json
{
  "tool": "validate_skill",
  "arguments": {
    "content": "---\nname: Test Skill\n---\n\n# Test\n\nThis is safe content.",
    "url": "https://raw.githubusercontent.com/example/repo/main/skill.md"
  }
}
```

**Response:**
```json
{
  "isValid": true,
  "issues": [],
  "severity": "safe"
}
```

**Unsafe Example:**
```json
{
  "tool": "validate_skill",
  "arguments": {
    "content": "---\nname: Dangerous Skill\n---\n\n# Dangerous\n\nRun: rm -rf /",
    "url": "https://raw.githubusercontent.com/example/repo/main/skill.md"
  }
}
```

**Response:**
```json
{
  "isValid": false,
  "issues": [
    {
      "type": "dangerous_command",
      "description": "Dangerous recursive delete command (rm -rf)",
      "location": "Line 7: rm -rf /"
    }
  ],
  "severity": "unsafe"
}
```

### 6. Convert to Steering File

Convert skill to Kiro steering file format:

```json
{
  "tool": "convert_to_steering",
  "arguments": {
    "content": "---\nname: PDF Extractor\ndescription: Extract text from PDF files\n---\n\n# PDF Extractor\n\nExtract text content from PDF documents.",
    "sourceUrl": "https://raw.githubusercontent.com/anthropics/skills/main/skills/pdf-extractor/SKILL.md"
  }
}
```

**Response:**
```json
{
  "steeringContent": "---\noriginal_skill: PDF Extractor\nsource_url: https://raw.githubusercontent.com/anthropics/skills/main/skills/pdf-extractor/SKILL.md\nimported_at: '2024-01-15T10:30:00.000Z'\n---\n\n# PDF Extractor\n\nExtract text from PDF files\n\n# PDF Extractor\n\nExtract text content from PDF documents.\n\n---\n*Imported from Claude Skills via Skill Loader Power*\n",
  "filename": "pdf-extractor.md",
  "metadata": {
    "originalSkill": "PDF Extractor",
    "sourceUrl": "https://raw.githubusercontent.com/anthropics/skills/main/skills/pdf-extractor/SKILL.md",
    "importedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### 7. Convert to Power

Convert skill to Kiro power format:

```json
{
  "tool": "convert_to_power",
  "arguments": {
    "content": "---\nname: PDF Extractor\ndescription: Extract text from PDF files\n---\n\n# PDF Extractor\n\nExtract text content from PDF documents.",
    "sourceUrl": "https://raw.githubusercontent.com/anthropics/skills/main/skills/pdf-extractor/SKILL.md"
  }
}
```

**Response:**
```json
{
  "powerContent": "---\nname: pdf-extractor\ndisplayName: PDF Extractor\ndescription: Extract text from PDF files\nkeywords:\n  - extract\n  - text\n  - files\nauthor: Imported from Claude Skills\n---\n\n# PDF Extractor\n\nExtract text content from PDF documents.\n\n---\n\n## Import Metadata\n\n- **Original Skill**: PDF Extractor\n- **Source URL**: https://raw.githubusercontent.com/anthropics/skills/main/skills/pdf-extractor/SKILL.md\n- **Imported At**: 2024-01-15T10:30:00.000Z\n- **Imported Via**: Skill Loader Power\n",
  "powerName": "pdf-extractor",
  "metadata": {
    "originalSkill": "PDF Extractor",
    "sourceUrl": "https://raw.githubusercontent.com/anthropics/skills/main/skills/pdf-extractor/SKILL.md",
    "importedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### 8. Import Skill (Complete Workflow)

Import a skill with a single command:

**Import as Steering File:**
```json
{
  "tool": "import_skill",
  "arguments": {
    "identifier": "anthropics/pdf-extractor",
    "outputFormat": "steering",
    "skipValidation": false
  }
}
```

**Response:**
```json
{
  "success": true,
  "content": "---\noriginal_skill: PDF Extractor\nsource_url: https://raw.githubusercontent.com/anthropics/skills/main/skills/pdf-extractor/SKILL.md\nimported_at: '2024-01-15T10:30:00.000Z'\n---\n\n...",
  "filename": "pdf-extractor.md",
  "targetPath": ".kiro/steering/pdf-extractor.md",
  "metadata": {
    "skillName": "PDF Extractor",
    "sourceUrl": "https://raw.githubusercontent.com/anthropics/skills/main/skills/pdf-extractor/SKILL.md",
    "outputFormat": "steering",
    "validationResult": {
      "isValid": true,
      "issues": [],
      "severity": "safe"
    }
  }
}
```

**Import as Power:**
```json
{
  "tool": "import_skill",
  "arguments": {
    "identifier": "anthropics/pdf-extractor",
    "outputFormat": "power",
    "skipValidation": false
  }
}
```

**Response:**
```json
{
  "success": true,
  "content": "---\nname: pdf-extractor\ndisplayName: PDF Extractor\n...",
  "filename": "POWER.md",
  "targetPath": "~/.kiro/powers/pdf-extractor/POWER.md",
  "metadata": {
    "skillName": "pdf-extractor",
    "sourceUrl": "https://raw.githubusercontent.com/anthropics/skills/main/skills/pdf-extractor/SKILL.md",
    "outputFormat": "power",
    "validationResult": {
      "isValid": true,
      "issues": [],
      "severity": "safe"
    }
  }
}
```

**Failed Import (Security Validation):**
```json
{
  "tool": "import_skill",
  "arguments": {
    "identifier": "malicious/dangerous-skill",
    "outputFormat": "steering",
    "skipValidation": false
  }
}
```

**Response:**
```json
{
  "success": false,
  "content": "",
  "filename": "",
  "targetPath": "",
  "metadata": {
    "skillName": "malicious/dangerous-skill",
    "sourceUrl": "https://raw.githubusercontent.com/malicious/repo/main/skills/dangerous-skill/SKILL.md",
    "outputFormat": "steering",
    "validationResult": {
      "isValid": false,
      "issues": [
        {
          "type": "dangerous_command",
          "description": "Dangerous recursive delete command (rm -rf)",
          "location": "Line 10: rm -rf /"
        }
      ],
      "severity": "unsafe"
    }
  },
  "error": "Security validation failed: Dangerous recursive delete command (rm -rf)"
}
```

## Common Workflows

### Discover and Import a Skill

1. Search for skills:
   ```json
   { "tool": "search_skills", "arguments": { "query": "pdf" } }
   ```

2. Fetch the skill to inspect:
   ```json
   { "tool": "fetch_skill", "arguments": { "identifier": "anthropics/pdf-extractor" } }
   ```

3. Import the skill:
   ```json
   { "tool": "import_skill", "arguments": { "identifier": "anthropics/pdf-extractor", "outputFormat": "steering" } }
   ```

### Browse Trending Skills

1. Get the 24-hour leaderboard:
   ```json
   { "tool": "get_leaderboard", "arguments": { "timeframe": "24h", "limit": 20 } }
   ```

2. Import a trending skill:
   ```json
   { "tool": "import_skill", "arguments": { "identifier": "owner/skill-name", "outputFormat": "power" } }
   ```

### Validate Before Importing

1. Fetch the skill:
   ```json
   { "tool": "fetch_skill", "arguments": { "identifier": "unknown/skill" } }
   ```

2. Validate the content:
   ```json
   { "tool": "validate_skill", "arguments": { "content": "...", "url": "..." } }
   ```

3. If safe, convert and use:
   ```json
   { "tool": "convert_to_steering", "arguments": { "content": "...", "sourceUrl": "..." } }
   ```

## Error Handling

All tools return errors in a consistent format:

```json
{
  "error": "Error message describing what went wrong",
  "tool": "tool_name",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

Common error scenarios:
- **Network errors**: Check internet connection, GitHub availability
- **Not found errors**: Verify skill name and repository
- **Validation errors**: Review security issues before proceeding
- **Parsing errors**: Check skill format and YAML syntax
