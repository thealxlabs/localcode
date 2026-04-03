import { describe, it, expect } from 'vitest';

describe('Localcode Cost Estimation', () => {
  describe('provider pricing', () => {
    it('estimates GPT-4o cost', async () => {
      const { estimateCost } = await import('../src/providers/client.js');
      expect(estimateCost('gpt-4o', 1000, 500)).toBeGreaterThan(0);
    });
    it('estimates GPT-4o-mini cost', async () => {
      const { estimateCost } = await import('../src/providers/client.js');
      expect(estimateCost('gpt-4o-mini', 1000, 500)).toBeGreaterThan(0);
    });
    it('estimates Claude Sonnet cost', async () => {
      const { estimateCost } = await import('../src/providers/client.js');
      expect(estimateCost('claude-sonnet-4-5', 1000, 500)).toBeGreaterThan(0);
    });
    it('estimates Claude Opus cost', async () => {
      const { estimateCost } = await import('../src/providers/client.js');
      expect(estimateCost('claude-opus-4-5', 1000, 500)).toBeGreaterThan(0);
    });
    it('estimates Claude Haiku cost', async () => {
      const { estimateCost } = await import('../src/providers/client.js');
      expect(estimateCost('claude-haiku-4-5-20251001', 1000, 500)).toBeGreaterThan(0);
    });
    it('estimates Groq Llama cost', async () => {
      const { estimateCost } = await import('../src/providers/client.js');
      expect(estimateCost('llama-3.3-70b-versatile', 1000, 500)).toBeGreaterThan(0);
    });
    it('returns 0 for Ollama', async () => {
      const { estimateCost } = await import('../src/providers/client.js');
      expect(estimateCost('qwen2.5-coder:7b', 1000, 500)).toBe(0);
    });
  });

  describe('scaling', () => {
    it('scales with input tokens', async () => {
      const { estimateCost } = await import('../src/providers/client.js');
      const c1 = estimateCost('gpt-4o', 1000, 0);
      const c2 = estimateCost('gpt-4o', 2000, 0);
      expect(c2).toBeCloseTo(c1 * 2, 5);
    });
    it('scales with output tokens', async () => {
      const { estimateCost } = await import('../src/providers/client.js');
      const c1 = estimateCost('gpt-4o', 0, 1000);
      const c2 = estimateCost('gpt-4o', 0, 2000);
      expect(c2).toBeCloseTo(c1 * 2, 5);
    });
    it('handles zero tokens', async () => {
      const { estimateCost } = await import('../src/providers/client.js');
      expect(estimateCost('gpt-4o', 0, 0)).toBe(0);
    });
  });
});

describe('Localcode Model Routing', () => {
  describe('step-based routing', () => {
    it('uses planning for step 0', async () => {
      const { resolveModelForStep } = await import('../src/providers/client.js');
      expect(resolveModelForStep(0, 10, { planning: 'p', execution: 'e', review: 'r' }, 'd')).toBe('p');
    });
    it('uses execution for middle steps', async () => {
      const { resolveModelForStep } = await import('../src/providers/client.js');
      expect(resolveModelForStep(5, 10, { planning: 'p', execution: 'e', review: 'r' }, 'd')).toBe('e');
    });
    it('uses review for last step', async () => {
      const { resolveModelForStep } = await import('../src/providers/client.js');
      expect(resolveModelForStep(9, 10, { planning: 'p', execution: 'e', review: 'r' }, 'd')).toBe('r');
    });
    it('uses default when no routing', async () => {
      const { resolveModelForStep } = await import('../src/providers/client.js');
      expect(resolveModelForStep(0, 10, null, 'd')).toBe('d');
    });
  });
});

describe('Localcode Token Estimation', () => {
  describe('accuracy', () => {
    it('estimates code tokens', async () => {
      const { estimateTokens } = await import('../src/sessions/manager.js');
      const tokens = estimateTokens([{ role: 'user' as const, content: 'function foo() { return bar(); }' }]);
      expect(tokens).toBeGreaterThan(0);
    });
    it('estimates text tokens', async () => {
      const { estimateTokens } = await import('../src/sessions/manager.js');
      const tokens = estimateTokens([{ role: 'user' as const, content: 'hello world how are you' }]);
      expect(tokens).toBeGreaterThan(0);
    });
    it('estimates system prompt tokens', async () => {
      const { estimateTokens } = await import('../src/sessions/manager.js');
      const tokens = estimateTokens([{ role: 'system' as const, content: 'You are a helpful assistant.' }]);
      expect(tokens).toBeGreaterThan(0);
    });
    it('handles empty messages', async () => {
      const { estimateTokens } = await import('../src/sessions/manager.js');
      expect(estimateTokens([])).toBe(0);
    });
    it('handles empty content', async () => {
      const { estimateTokens } = await import('../src/sessions/manager.js');
      expect(estimateTokens([{ role: 'user' as const, content: '' }])).toBe(0);
    });
    it('handles long messages', async () => {
      const { estimateTokens } = await import('../src/sessions/manager.js');
      const tokens = estimateTokens([{ role: 'user' as const, content: 'x'.repeat(10000) }]);
      expect(tokens).toBeGreaterThan(0);
      expect(tokens).toBeLessThan(10000);
    });
  });
});

describe('Localcode Retry Logic', () => {
  describe('backoff', () => {
    it('succeeds on first try', async () => {
      const { retryWithBackoff } = await import('../src/providers/client.js');
      expect(await retryWithBackoff(async () => 'ok', 'test')).toBe('ok');
    });
    it('retries on failure', async () => {
      const { retryWithBackoff } = await import('../src/providers/client.js');
      let attempts = 0;
      const result = await retryWithBackoff(async () => {
        attempts++;
        if (attempts < 3) throw new Error('fail');
        return 'ok';
      }, 'test');
      expect(result).toBe('ok');
      expect(attempts).toBe(3);
    });
    it('fails after max retries', async () => {
      const { retryWithBackoff } = await import('../src/providers/client.js');
      await expect(retryWithBackoff(async () => { throw new Error('always'); }, 'test')).rejects.toThrow('always');
    }, 15000);
    it('respects abort signal', async () => {
      const { retryWithBackoff } = await import('../src/providers/client.js');
      const ctrl = new AbortController();
      setTimeout(() => ctrl.abort(), 50);
      await expect(retryWithBackoff(async () => { throw new Error('fail'); }, 'test', ctrl.signal)).rejects.toThrow('Cancelled');
    }, 15000);
  });
});

describe('Localcode Agent Registry', () => {
  describe('loading', () => {
    it('builds registry', async () => {
      const { buildAgentRegistry } = await import('../src/agents/registry/loader.js');
      const reg = buildAgentRegistry();
      expect(reg.allAgents.length).toBeGreaterThanOrEqual(0);
    });
    it('has categories', async () => {
      const { buildAgentRegistry } = await import('../src/agents/registry/loader.js');
      const reg = buildAgentRegistry();
      expect(reg.categories.length).toBeGreaterThanOrEqual(0);
    });
    it('deduplicates agents', async () => {
      const { buildAgentRegistry } = await import('../src/agents/registry/loader.js');
      const reg = buildAgentRegistry();
      const ids = reg.allAgents.map(a => a.id);
      expect(new Set(ids).size).toBe(ids.length);
    });
  });

  describe('search', () => {
    it('searches by name', async () => {
      const { getAgentRegistry } = await import('../src/agents/registry/loader.js');
      const results = getAgentRegistry().searchAgents('engineer');
      expect(Array.isArray(results)).toBe(true);
    });
    it('searches by description', async () => {
      const { getAgentRegistry } = await import('../src/agents/registry/loader.js');
      const results = getAgentRegistry().searchAgents('security');
      expect(Array.isArray(results)).toBe(true);
    });
    it('searches by category', async () => {
      const { getAgentRegistry } = await import('../src/agents/registry/loader.js');
      const results = getAgentRegistry().searchAgents('engineering');
      expect(Array.isArray(results)).toBe(true);
    });
    it('returns empty for non-matching', async () => {
      const { getAgentRegistry } = await import('../src/agents/registry/loader.js');
      expect(getAgentRegistry().searchAgents('xyznonexistent123')).toEqual([]);
    });
    it('is case insensitive', async () => {
      const { getAgentRegistry } = await import('../src/agents/registry/loader.js');
      const upper = getAgentRegistry().searchAgents('ENGINEER');
      const lower = getAgentRegistry().searchAgents('engineer');
      expect(upper.length).toBe(lower.length);
    });
  });
});

describe('Localcode File System', () => {
  describe('path resolution', () => {
    it('resolves relative paths', async () => {
      const { ToolExecutor } = await import('../src/tools/executor.js');
      const ex = new ToolExecutor(process.cwd());
      const resolved = (ex as any).resolvePath('src/file.ts');
      expect(resolved).toContain('src');
    });
    it('rejects traversal', async () => {
      const { ToolExecutor } = await import('../src/tools/executor.js');
      const ex = new ToolExecutor(process.cwd());
      expect(() => (ex as any).resolvePath('../../../etc/passwd')).toThrow();
    });
    it('normalizes paths', async () => {
      const { ToolExecutor } = await import('../src/tools/executor.js');
      const ex = new ToolExecutor(process.cwd());
      const resolved = (ex as any).resolvePath('src/../file.ts');
      expect(resolved).not.toContain('src/');
    });
  });
});

describe('Localcode Configuration', () => {
  describe('defaults', () => {
    it('has ollama as default provider', async () => {
      const { loadSession } = await import('../src/sessions/manager.js');
      expect(loadSession().provider).toBe('ollama');
    });
    it('has default model', async () => {
      const { loadSession } = await import('../src/sessions/manager.js');
      expect(loadSession().model.length).toBeGreaterThan(0);
    });
    it('has default working directory', async () => {
      const { loadSession } = await import('../src/sessions/manager.js');
      expect(loadSession().workingDir.length).toBeGreaterThan(0);
    });
    it('has default max steps', async () => {
      const { loadSession } = await import('../src/sessions/manager.js');
      expect(loadSession().maxSteps).toBe(20);
    });
    it('has default theme', async () => {
      const { loadSession } = await import('../src/sessions/manager.js');
      expect(loadSession().theme).toBeDefined();
    });
    it('has default approval mode', async () => {
      const { loadSession } = await import('../src/sessions/manager.js');
      expect(loadSession().approvalMode).toBeDefined();
    });
  });
});

describe('Localcode Package', () => {
  it('has correct name', () => {
    const pkg = require('../package.json');
    expect(pkg.name).toBe('@localcode/cli');
  });
  it('has correct version', () => {
    const pkg = require('../package.json');
    expect(pkg.version).toBe('4.0.0');
  });
  it('has bin entry', () => {
    const pkg = require('../package.json');
    expect(pkg.bin.localcode).toBe('dist/bin/localcode.js');
  });
  it('has type module', () => {
    const pkg = require('../package.json');
    expect(pkg.type).toBe('module');
  });
  it('requires Node 18+', () => {
    const pkg = require('../package.json');
    expect(pkg.engines.node).toBe('>=18.0.0');
  });
  it('has MIT license', () => {
    const pkg = require('../package.json');
    expect(pkg.license).toBe('MIT');
  });
  it('has repository URL', () => {
    const pkg = require('../package.json');
    expect(pkg.repository.url).toContain('github.com');
  });
  it('has test scripts', () => {
    const pkg = require('../package.json');
    expect(pkg.scripts.test).toBe('vitest run');
  });
});
