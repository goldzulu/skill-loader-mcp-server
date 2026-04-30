import { ConversionEngine } from './conversion-engine.js';

describe('ConversionEngine', () => {
  let engine: ConversionEngine;

  beforeEach(() => {
    engine = new ConversionEngine();
  });

  describe('parseSkill', () => {
    it('parses valid skill with frontmatter and body', () => {
      const content = `---
name: test-skill
description: A test skill
---

# Instructions

Do the thing.

## Details

More details here.`;

      const result = engine.parseSkill(content);
      expect(result.frontmatter.name).toBe('test-skill');
      expect(result.frontmatter.description).toBe('A test skill');
      expect(result.sections).toHaveLength(2);
      expect(result.sections[0].heading).toBe('Instructions');
      expect(result.sections[1].heading).toBe('Details');
    });

    it('throws on empty content', () => {
      expect(() => engine.parseSkill('')).toThrow('empty');
    });

    it('throws on missing name in frontmatter', () => {
      const content = `---
description: Missing name
---

# Body`;
      expect(() => engine.parseSkill(content)).toThrow('name');
    });

    it('throws on missing description in frontmatter', () => {
      const content = `---
name: no-desc
---

# Body`;
      expect(() => engine.parseSkill(content)).toThrow('description');
    });

    it('handles content without frontmatter', () => {
      const content = '# Just a heading\n\nSome content.';
      const result = engine.parseSkill(content);
      expect(result.frontmatter.name).toBe('Untitled Skill');
      expect(result.sections).toHaveLength(1);
    });

    it('preserves code blocks when extracting sections', () => {
      const content = `---
name: code-skill
description: Has code blocks
---

# Setup

\`\`\`bash
# This is not a heading
echo hello
\`\`\`

## Config

Some config.`;

      const result = engine.parseSkill(content);
      expect(result.sections).toHaveLength(2);
      expect(result.sections[0].heading).toBe('Setup');
      expect(result.sections[0].content).toContain('# This is not a heading');
      expect(result.sections[1].heading).toBe('Config');
    });

    it('parses dependencies from frontmatter', () => {
      const content = `---
name: dep-skill
description: Has deps
dependencies:
  - react
  - typescript
---

# Body`;

      const result = engine.parseSkill(content);
      expect(result.frontmatter.dependencies).toEqual(['react', 'typescript']);
    });
  });

  describe('toSteeringFile', () => {
    it('converts parsed skill to steering format', () => {
      const content = `---
name: my-skill
description: A cool skill
---

# Instructions

Do stuff.`;

      const parsed = engine.parseSkill(content);
      const steering = engine.toSteeringFile(parsed, 'https://example.com');

      expect(steering.filename).toBe('my-skill.md');
      expect(steering.content).toContain('original_skill: my-skill');
      expect(steering.content).toContain('source_url: https://example.com');
      expect(steering.content).toContain('Imported from Claude Skills');
      expect(steering.metadata.originalSkill).toBe('my-skill');
    });

    it('generates kebab-case filenames', () => {
      const content = `---
name: PDF Extractor Tool
description: Extracts PDFs
---

# Body`;

      const parsed = engine.parseSkill(content);
      const steering = engine.toSteeringFile(parsed);
      expect(steering.filename).toBe('pdf-extractor-tool.md');
    });

    it('includes dependencies section when present', () => {
      const content = `---
name: dep-skill
description: Has deps
dependencies:
  - react
  - vue
---

# Body`;

      const parsed = engine.parseSkill(content);
      const steering = engine.toSteeringFile(parsed);
      expect(steering.content).toContain('## Dependencies');
      expect(steering.content).toContain('- react');
      expect(steering.content).toContain('- vue');
    });
  });

  describe('toPower', () => {
    it('converts parsed skill to power format', () => {
      const content = `---
name: my-power
description: A powerful skill
---

# Instructions

Do power stuff.`;

      const parsed = engine.parseSkill(content);
      const power = engine.toPower(parsed, 'https://example.com');

      expect(power.powerName).toBe('my-power');
      expect(power.files.length).toBeGreaterThanOrEqual(1);
      expect(power.files[0].path).toBe('POWER.md');
      expect(power.files[0].content).toContain('displayName: my-power');
      expect(power.files[0].content).toContain('Source URL');
    });

    it('generates mcp.json when skill has dependencies', () => {
      const content = `---
name: dep-power
description: Power with deps
dependencies:
  - express
  - cors
---

# Body`;

      const parsed = engine.parseSkill(content);
      const power = engine.toPower(parsed);

      const mcpFile = power.files.find(f => f.path === 'mcp.json');
      expect(mcpFile).toBeDefined();
      const mcpJson = JSON.parse(mcpFile!.content);
      expect(mcpJson.dependencies).toEqual(['express', 'cors']);
    });

    it('does not generate mcp.json when skill has no dependencies', () => {
      const content = `---
name: simple-power
description: No deps
---

# Body`;

      const parsed = engine.parseSkill(content);
      const power = engine.toPower(parsed);

      const mcpFile = power.files.find(f => f.path === 'mcp.json');
      expect(mcpFile).toBeUndefined();
    });

    it('generates steering/ directory for skills with 3+ complex sections', () => {
      // Create content with 3+ sections that have >200 chars each
      const longContent = 'A'.repeat(250);
      const content = `---
name: complex-power
description: Complex skill
---

# Main

## Section One

${longContent}

## Section Two

${longContent}

## Section Three

${longContent}`;

      const parsed = engine.parseSkill(content);
      const power = engine.toPower(parsed);

      const steeringFile = power.files.find(f => f.path.startsWith('steering/'));
      expect(steeringFile).toBeDefined();
      expect(steeringFile!.path).toBe('steering/complex-power-guidelines.md');
    });
  });
});
