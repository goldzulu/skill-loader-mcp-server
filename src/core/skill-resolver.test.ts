import { SkillResolver } from './skill-resolver.js';

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch as any;

describe('SkillResolver', () => {
  let resolver: SkillResolver;

  beforeEach(() => {
    resolver = new SkillResolver();
    mockFetch.mockReset();
  });

  describe('resolve (GitHub format)', () => {
    it('resolves owner/skill-name to agent-skills repo', async () => {
      const result = await resolver.resolve('vercel-labs/react-best-practices');
      expect(result.owner).toBe('vercel-labs');
      expect(result.repo).toBe('agent-skills');
      expect(result.skillPath).toBe('skills/react-best-practices');
      expect(result.source).toBe('github');
      expect(result.fullUrl).toContain('raw.githubusercontent.com');
    });

    it('resolves owner/repo/skill-name format', async () => {
      const result = await resolver.resolve('anthropics/skills/pdf');
      expect(result.owner).toBe('anthropics');
      expect(result.repo).toBe('skills');
      expect(result.skillPath).toBe('skills/pdf');
      expect(result.source).toBe('github');
    });

    it('handles owner/repo/skills/skill-name format', async () => {
      const result = await resolver.resolve('owner/repo/skills/my-skill');
      expect(result.owner).toBe('owner');
      expect(result.repo).toBe('repo');
      expect(result.skillPath).toBe('skills/my-skill');
    });

    it('throws for invalid format with single part', async () => {
      // Single part with a slash should still fail
      await expect(resolver.resolve('/')).rejects.toThrow();
    });
  });

  describe('resolve (skills.sh lookup)', () => {
    it('searches skills.sh for simple name and resolves exact match', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          query: 'pdf',
          searchType: 'fuzzy',
          skills: [
            {
              id: 'anthropics/skills/pdf',
              skillId: 'pdf',
              name: 'pdf',
              installs: 12345,
              source: 'anthropics/skills',
            },
          ],
          count: 1,
          duration_ms: 10,
        }),
      });

      const result = await resolver.resolve('pdf');
      expect(result.owner).toBe('anthropics');
      expect(result.repo).toBe('skills');
      expect(result.source).toBe('skills.sh');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/search?q=pdf')
      );
    });

    it('throws when no match is found', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          query: 'nonexistent',
          searchType: 'fuzzy',
          skills: [],
          count: 0,
          duration_ms: 5,
        }),
      });

      await expect(resolver.resolve('nonexistent')).rejects.toThrow('not found');
    });

    it('throws on ambiguous matches', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          query: 'react',
          searchType: 'fuzzy',
          skills: [
            { id: 'a/b/react-hooks', skillId: 'react-hooks', name: 'react-hooks', installs: 100, source: 'a/b' },
            { id: 'c/d/react-forms', skillId: 'react-forms', name: 'react-forms', installs: 50, source: 'c/d' },
          ],
          count: 2,
          duration_ms: 8,
        }),
      });

      await expect(resolver.resolve('react')).rejects.toThrow('Multiple');
    });
  });

  describe('searchSkillsSh', () => {
    it('returns parsed search results', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          query: 'test',
          searchType: 'fuzzy',
          skills: [
            { id: 'owner/repo/test-skill', skillId: 'test-skill', name: 'test-skill', installs: 500, source: 'owner/repo' },
          ],
          count: 1,
          duration_ms: 3,
        }),
      });

      const results = await resolver.searchSkillsSh('test');
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('test-skill');
      expect(results[0].owner).toBe('owner');
      expect(results[0].repo).toBe('repo');
      expect(results[0].installs).toBe(500);
    });

    it('caches search results', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          query: 'cached',
          searchType: 'fuzzy',
          skills: [
            { id: 'o/r/cached', skillId: 'cached', name: 'cached', installs: 1, source: 'o/r' },
          ],
          count: 1,
          duration_ms: 1,
        }),
      });

      await resolver.searchSkillsSh('cached');
      await resolver.searchSkillsSh('cached');
      // fetch should only be called once due to caching
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('throws on HTTP error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      await expect(resolver.searchSkillsSh('error')).rejects.toThrow();
    });
  });

  describe('getLeaderboard', () => {
    it('throws without API key', async () => {
      delete process.env.SKILLS_SH_API_KEY;
      await expect(resolver.getLeaderboard()).rejects.toThrow('SKILLS_SH_API_KEY');
    });

    it('fetches leaderboard with API key', async () => {
      process.env.SKILLS_SH_API_KEY = 'test-key';
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          skills: [
            { id: '1', name: 'top-skill', owner: 'org', repo: 'skills', installs: 99999 },
          ],
          total: 1,
          offset: 0,
          limit: 50,
        }),
      });

      const results = await resolver.getLeaderboard('all', 10);
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('top-skill');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('view=all-time'),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-key',
          }),
        })
      );
      delete process.env.SKILLS_SH_API_KEY;
    });
  });

  describe('listSkills', () => {
    it('throws without API key', async () => {
      delete process.env.SKILLS_SH_API_KEY;
      await expect(resolver.listSkills()).rejects.toThrow('SKILLS_SH_API_KEY');
    });

    it('fetches paginated skills with API key', async () => {
      process.env.SKILLS_SH_API_KEY = 'test-key';
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          skills: [
            { id: '1', name: 'skill-a', owner: 'org', repo: 'skills', installs: 100 },
            { id: '2', name: 'skill-b', owner: 'org', repo: 'skills', installs: 50 },
          ],
          total: 200,
          offset: 0,
          limit: 2,
        }),
      });

      const result = await resolver.listSkills(1, 2);
      expect(result.skills).toHaveLength(2);
      expect(result.total).toBe(200);
      delete process.env.SKILLS_SH_API_KEY;
    });
  });
});
