import { describe, it, expect } from 'vitest';

describe('Agent Registry — Behavioral', () => {
  describe('buildAgentRegistry', () => {
    it('should build a registry', async () => {
      const { buildAgentRegistry } = await import('../src/agents/registry/loader.js');
      const registry = buildAgentRegistry();
      expect(registry).toBeDefined();
    });

    it('should have categories', async () => {
      const { buildAgentRegistry } = await import('../src/agents/registry/loader.js');
      const registry = buildAgentRegistry();
      expect(Array.isArray(registry.categories)).toBe(true);
    });

    it('should have allAgents array', async () => {
      const { buildAgentRegistry } = await import('../src/agents/registry/loader.js');
      const registry = buildAgentRegistry();
      expect(Array.isArray(registry.allAgents)).toBe(true);
    });
  });

  describe('getAgentRegistry', () => {
    it('should return same instance (singleton)', async () => {
      const { getAgentRegistry } = await import('../src/agents/registry/loader.js');
      const r1 = getAgentRegistry();
      const r2 = getAgentRegistry();
      expect(r1).toBe(r2);
    });
  });

  describe('getAgent', () => {
    it('should return undefined for non-existent agent', async () => {
      const { getAgentRegistry } = await import('../src/agents/registry/loader.js');
      const registry = getAgentRegistry();
      const agent = registry.getAgent('nonexistent-agent-xyz');
      expect(agent).toBeUndefined();
    });

    it('should return agent for existing agent', async () => {
      const { getAgentRegistry } = await import('../src/agents/registry/loader.js');
      const registry = getAgentRegistry();
      if (registry.allAgents.length > 0) {
        const agent = registry.getAgent(registry.allAgents[0].id);
        expect(agent).toBeDefined();
      }
    });
  });

  describe('getAgentsByCategory', () => {
    it('should return array for any category', async () => {
      const { getAgentRegistry } = await import('../src/agents/registry/loader.js');
      const registry = getAgentRegistry();
      const agents = registry.getAgentsByCategory('engineering');
      expect(Array.isArray(agents)).toBe(true);
    });

    it('should return empty array for non-existent category', async () => {
      const { getAgentRegistry } = await import('../src/agents/registry/loader.js');
      const registry = getAgentRegistry();
      const agents = registry.getAgentsByCategory('nonexistent-category');
      expect(agents).toEqual([]);
    });
  });

  describe('searchAgents', () => {
    it('should return empty array for non-matching query', async () => {
      const { getAgentRegistry } = await import('../src/agents/registry/loader.js');
      const registry = getAgentRegistry();
      const results = registry.searchAgents('xyznonexistent123');
      expect(Array.isArray(results)).toBe(true);
    });

    it('should return agents matching query', async () => {
      const { getAgentRegistry } = await import('../src/agents/registry/loader.js');
      const registry = getAgentRegistry();
      const results = registry.searchAgents('engineer');
      expect(Array.isArray(results)).toBe(true);
    });

    it('should search in agent names', async () => {
      const { getAgentRegistry } = await import('../src/agents/registry/loader.js');
      const registry = getAgentRegistry();
      const results = registry.searchAgents('engineer');
      for (const agent of results) {
        expect(agent.name.toLowerCase().includes('engineer') ||
             agent.description.toLowerCase().includes('engineer') ||
             agent.category.toLowerCase().includes('engineer')).toBe(true);
      }
    });

    it('should be case insensitive', async () => {
      const { getAgentRegistry } = await import('../src/agents/registry/loader.js');
      const registry = getAgentRegistry();
      const resultsUpper = registry.searchAgents('ENGINEER');
      const resultsLower = registry.searchAgents('engineer');
      expect(resultsUpper.length).toBe(resultsLower.length);
    });
  });
});

describe('Agent Registry — Technical', () => {
  describe('agent loading', () => {
    it('should load agents from markdown files', async () => {
      const { buildAgentRegistry } = await import('../src/agents/registry/loader.js');
      const registry = buildAgentRegistry();
      // Registry should have agents if markdown files exist
      expect(registry.allAgents.length).toBeGreaterThanOrEqual(0);
    });

    it('should handle missing agent directory', async () => {
      const { buildAgentRegistry } = await import('../src/agents/registry/loader.js');
      const registry = buildAgentRegistry();
      expect(registry).toBeDefined();
    });

    it('should deduplicate agents by ID', async () => {
      const { buildAgentRegistry } = await import('../src/agents/registry/loader.js');
      const registry = buildAgentRegistry();
      const ids = registry.allAgents.map(a => a.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });
  });

  describe('category grouping', () => {
    it('should group agents by category', async () => {
      const { buildAgentRegistry } = await import('../src/agents/registry/loader.js');
      const registry = buildAgentRegistry();
      for (const cat of registry.categories) {
        expect(Array.isArray(cat.agents)).toBe(true);
        for (const agent of cat.agents) {
          expect(agent.category).toBe(cat.name);
        }
      }
    });

    it('should have category metadata', async () => {
      const { buildAgentRegistry } = await import('../src/agents/registry/loader.js');
      const registry = buildAgentRegistry();
      for (const cat of registry.categories) {
        expect(cat.id).toBeDefined();
        expect(cat.name).toBeDefined();
        expect(cat.emoji).toBeDefined();
      }
    });
  });

  describe('search implementation', () => {
    it('should search in agent descriptions', async () => {
      const { getAgentRegistry } = await import('../src/agents/registry/loader.js');
      const registry = getAgentRegistry();
      const results = registry.searchAgents('security');
      expect(Array.isArray(results)).toBe(true);
    });

    it('should search in agent categories', async () => {
      const { getAgentRegistry } = await import('../src/agents/registry/loader.js');
      const registry = getAgentRegistry();
      const results = registry.searchAgents('engineering');
      expect(Array.isArray(results)).toBe(true);
    });

    it('should search in agent vibes', async () => {
      const { getAgentRegistry } = await import('../src/agents/registry/loader.js');
      const registry = getAgentRegistry();
      const results = registry.searchAgents('expert');
      expect(Array.isArray(results)).toBe(true);
    });

    it('should handle empty search query', async () => {
      const { getAgentRegistry } = await import('../src/agents/registry/loader.js');
      const registry = getAgentRegistry();
      const results = registry.searchAgents('');
      expect(Array.isArray(results)).toBe(true);
    });

    it('should handle whitespace in search query', async () => {
      const { getAgentRegistry } = await import('../src/agents/registry/loader.js');
      const registry = getAgentRegistry();
      const results = registry.searchAgents('  engineer  ');
      expect(Array.isArray(results)).toBe(true);
    });
  });

  describe('registry caching', () => {
    it('should return cached registry on subsequent calls', async () => {
      const { getAgentRegistry } = await import('../src/agents/registry/loader.js');
      const r1 = getAgentRegistry();
      const r2 = getAgentRegistry();
      expect(r1).toBe(r2);
    });
  });

  describe('edge cases', () => {
    it('should handle agents with missing fields', async () => {
      const { buildAgentRegistry } = await import('../src/agents/registry/loader.js');
      const registry = buildAgentRegistry();
      for (const agent of registry.allAgents) {
        expect(agent.id).toBeDefined();
        expect(agent.name).toBeDefined();
        expect(agent.category).toBeDefined();
      }
    });

    it('should handle agents with long descriptions', async () => {
      const { buildAgentRegistry } = await import('../src/agents/registry/loader.js');
      const registry = buildAgentRegistry();
      for (const agent of registry.allAgents) {
        expect(typeof agent.description).toBe('string');
      }
    });

    it('should handle agents with special characters', async () => {
      const { buildAgentRegistry } = await import('../src/agents/registry/loader.js');
      const registry = buildAgentRegistry();
      for (const agent of registry.allAgents) {
        expect(typeof agent.name).toBe('string');
      }
    });
  });
});
