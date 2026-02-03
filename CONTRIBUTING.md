# Contributing to Skill Loader MCP Server

Thank you for your interest in contributing to the Skill Loader MCP Server! This document provides guidelines and instructions for contributing.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [How to Contribute](#how-to-contribute)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Submitting Changes](#submitting-changes)
- [Reporting Bugs](#reporting-bugs)
- [Suggesting Features](#suggesting-features)

## Code of Conduct

This project adheres to a Code of Conduct that all contributors are expected to follow. Please read [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) before contributing.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/skill-loader-mcp-server.git`
3. Add upstream remote: `git remote add upstream https://github.com/goldzulu/skill-loader-mcp-server.git`
4. Create a new branch: `git checkout -b feature/your-feature-name`

## Development Setup

### Prerequisites

- Node.js >= 18.0.0
- npm or yarn
- Git

### Installation

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test
```

### Project Structure

```
skill-loader-mcp-server/
├── src/
│   ├── core/           # Core functionality
│   ├── tools/          # MCP tool implementations
│   ├── utils/          # Utility functions
│   ├── index.ts        # Main entry point
│   └── cli.ts          # CLI entry point
├── examples/           # Usage examples
├── dist/               # Compiled output
└── tests/              # Test files
```

## How to Contribute

### Types of Contributions

We welcome various types of contributions:

- **Bug fixes**: Fix issues in existing code
- **New features**: Add new MCP tools or functionality
- **Documentation**: Improve README, examples, or code comments
- **Tests**: Add or improve test coverage
- **Performance**: Optimize existing code
- **Refactoring**: Improve code quality without changing functionality

### Before You Start

1. Check existing [issues](https://github.com/goldzulu/skill-loader-mcp-server/issues) and [pull requests](https://github.com/goldzulu/skill-loader-mcp-server/pulls)
2. For major changes, open an issue first to discuss your proposal
3. For minor fixes, feel free to submit a PR directly

## Coding Standards

### TypeScript Style Guide

- Use TypeScript for all new code
- Follow existing code style and conventions
- Use meaningful variable and function names
- Add JSDoc comments for public APIs
- Keep functions small and focused
- Avoid `any` types when possible

### Code Formatting

```bash
# Format code (if prettier is configured)
npm run format

# Lint code
npm run lint
```

### Naming Conventions

- **Files**: kebab-case (e.g., `skill-fetcher.ts`)
- **Classes**: PascalCase (e.g., `SkillFetcher`)
- **Functions**: camelCase (e.g., `fetchSkill`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_RETRIES`)
- **Interfaces**: PascalCase with `I` prefix (e.g., `ISkillData`)

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Writing Tests

- Write tests for all new features
- Maintain or improve code coverage
- Use descriptive test names
- Test edge cases and error conditions
- Mock external dependencies (API calls, file system)

### Test Structure

```typescript
describe('SkillFetcher', () => {
  describe('fetchSkill', () => {
    it('should fetch skill from GitHub', async () => {
      // Arrange
      const skillId = 'author/skill-name';
      
      // Act
      const result = await fetcher.fetchSkill(skillId);
      
      // Assert
      expect(result).toBeDefined();
      expect(result.content).toContain('skill content');
    });
  });
});
```

## Submitting Changes

### Pull Request Process

1. **Update your fork**:
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. **Make your changes**:
   - Write clear, concise commit messages
   - Keep commits focused and atomic
   - Add tests for new functionality

3. **Test your changes**:
   ```bash
   npm run build
   npm test
   ```

4. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```

5. **Create a Pull Request**:
   - Use a clear, descriptive title
   - Reference related issues (e.g., "Fixes #123")
   - Describe what changed and why
   - Include screenshots for UI changes
   - List any breaking changes

### Commit Message Format

```
type(scope): subject

body (optional)

footer (optional)
```

**Types**:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples**:
```
feat(tools): add batch import functionality

fix(security): improve validation for eval patterns

docs(readme): update installation instructions
```

### Pull Request Checklist

- [ ] Code follows project style guidelines
- [ ] Tests added/updated and passing
- [ ] Documentation updated (if needed)
- [ ] CHANGELOG.md updated (for notable changes)
- [ ] No breaking changes (or clearly documented)
- [ ] Commit messages are clear and descriptive

## Reporting Bugs

### Before Submitting a Bug Report

1. Check the [existing issues](https://github.com/goldzulu/skill-loader-mcp-server/issues)
2. Update to the latest version
3. Try to reproduce the issue

### How to Submit a Bug Report

Use the [Bug Report template](.github/ISSUE_TEMPLATE/bug_report.md) and include:

- **Description**: Clear description of the bug
- **Steps to Reproduce**: Detailed steps to reproduce the issue
- **Expected Behavior**: What you expected to happen
- **Actual Behavior**: What actually happened
- **Environment**: OS, Node version, package version
- **Logs**: Relevant error messages or logs
- **Screenshots**: If applicable

## Suggesting Features

### Before Submitting a Feature Request

1. Check if the feature already exists
2. Search [existing feature requests](https://github.com/goldzulu/skill-loader-mcp-server/issues?q=is%3Aissue+label%3Aenhancement)
3. Consider if it fits the project scope

### How to Submit a Feature Request

Use the [Feature Request template](.github/ISSUE_TEMPLATE/feature_request.md) and include:

- **Problem**: What problem does this solve?
- **Solution**: Describe your proposed solution
- **Alternatives**: Alternative solutions you've considered
- **Use Cases**: Real-world examples of how this would be used
- **Implementation**: Ideas on how to implement (optional)

## Development Workflow

### Typical Workflow

1. Pick an issue or create one
2. Comment on the issue to claim it
3. Create a feature branch
4. Make your changes
5. Write/update tests
6. Update documentation
7. Submit a pull request
8. Address review feedback
9. Merge (by maintainers)

### Branch Naming

- `feature/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation updates
- `refactor/description` - Code refactoring
- `test/description` - Test additions/updates

## Getting Help

- **Questions**: Open a [discussion](https://github.com/goldzulu/skill-loader-mcp-server/discussions) or issue
- **Chat**: Join our community (if available)
- **Email**: Contact maintainers (see package.json)

## Recognition

Contributors will be:
- Listed in the project README
- Mentioned in release notes
- Credited in the CHANGELOG

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to Skill Loader MCP Server! 🎉
