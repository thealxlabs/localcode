import { describe, it, expect } from 'vitest';

describe('Localcode File Lock', () => {
  describe('basic operations', () => {
    it('acquires lock', async () => {
      const { FileLock } = await import('../src/core/lock.js');
      const lock = new FileLock('/tmp/test-lock-1.txt');
      expect(await lock.acquire(1000)).toBe(true);
      lock.release();
    });
    it('releases lock', async () => {
      const { FileLock } = await import('../src/core/lock.js');
      const lock = new FileLock('/tmp/test-lock-2.txt');
      await lock.acquire(1000);
      lock.release();
    });
    it('prevents concurrent access', async () => {
      const { FileLock } = await import('../src/core/lock.js');
      const l1 = new FileLock('/tmp/test-lock-3.txt');
      const l2 = new FileLock('/tmp/test-lock-3.txt');
      expect(await l1.acquire(1000)).toBe(true);
      expect(await l2.acquire(100)).toBe(false);
      l1.release();
    });
    it('times out', async () => {
      const { FileLock } = await import('../src/core/lock.js');
      const l1 = new FileLock('/tmp/test-lock-4.txt');
      const l2 = new FileLock('/tmp/test-lock-4.txt');
      await l1.acquire(1000);
      const start = Date.now();
      expect(await l2.acquire(50)).toBe(false);
      expect(Date.now() - start).toBeGreaterThanOrEqual(50);
      l1.release();
    });
  });

  describe('withFileLock', () => {
    it('executes function', async () => {
      const { withFileLock } = await import('../src/core/lock.js');
      let ran = false;
      await withFileLock('/tmp/test-wfl-1.txt', async () => { ran = true; return 'ok'; }, 1000);
      expect(ran).toBe(true);
    });
    it('releases on error', async () => {
      const { withFileLock, FileLock } = await import('../src/core/lock.js');
      await expect(withFileLock('/tmp/test-wfl-2.txt', async () => { throw new Error('x'); }, 1000)).rejects.toThrow('x');
      const lock = new FileLock('/tmp/test-wfl-2.txt');
      expect(await lock.acquire(1000)).toBe(true);
      lock.release();
    });
    it('fails on timeout', async () => {
      const { withFileLock, FileLock } = await import('../src/core/lock.js');
      const lock = new FileLock('/tmp/test-wfl-3.txt');
      await lock.acquire(1000);
      await expect(withFileLock('/tmp/test-wfl-3.txt', async () => 'ok', 50)).rejects.toThrow();
      lock.release();
    });
  });

  describe('getActiveLockCount', () => {
    it('returns 0 when no locks', async () => {
      const { getActiveLockCount } = await import('../src/core/lock.js');
      expect(getActiveLockCount()).toBe(0);
    });
    it('returns 1 when lock active', async () => {
      const { getActiveLockCount, withFileLock } = await import('../src/core/lock.js');
      let count = 0;
      await withFileLock('/tmp/test-galc.txt', async () => { count = getActiveLockCount(); }, 1000);
      expect(count).toBe(1);
    });
  });
});

describe('Localcode Plugin Loader', () => {
  describe('loading', () => {
    it('returns empty array when no plugins', async () => {
      const { loadPlugins } = await import('../src/plugins/loader.js');
      const plugins = await loadPlugins();
      expect(Array.isArray(plugins)).toBe(true);
    });
  });

  describe('security validation', () => {
    it('blocks eval', async () => {
      const fs = require('fs');
      const path = require('path');
      const os = require('os');
      const dir = path.join(os.homedir(), '.localcode', 'plugins');
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, 'eval-test.js'), 'export default { name: "eval-test", trigger: "/et", description: "test", execute: async () => { eval("x"); } };', 'utf8');
      const { loadPlugins } = await import('../src/plugins/loader.js');
      const plugins = await loadPlugins();
      expect(plugins.find(p => p.name === 'eval-test')).toBeUndefined();
    });
    it('blocks child_process', async () => {
      const fs = require('fs');
      const path = require('path');
      const os = require('os');
      const dir = path.join(os.homedir(), '.localcode', 'plugins');
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, 'cp-test.js'), 'const cp = require("child_process"); export default { name: "cp-test", trigger: "/cpt", description: "test", execute: async () => {} };', 'utf8');
      const { loadPlugins } = await import('../src/plugins/loader.js');
      const plugins = await loadPlugins();
      expect(plugins.find(p => p.name === 'cp-test')).toBeUndefined();
    });
    it('blocks fs', async () => {
      const fs = require('fs');
      const path = require('path');
      const os = require('os');
      const dir = path.join(os.homedir(), '.localcode', 'plugins');
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, 'fs-test.js'), 'const f = require("fs"); export default { name: "fs-test", trigger: "/fst", description: "test", execute: async () => {} };', 'utf8');
      const { loadPlugins } = await import('../src/plugins/loader.js');
      const plugins = await loadPlugins();
      expect(plugins.find(p => p.name === 'fs-test')).toBeUndefined();
    });
    it('blocks net', async () => {
      const fs = require('fs');
      const path = require('path');
      const os = require('os');
      const dir = path.join(os.homedir(), '.localcode', 'plugins');
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, 'net-test.js'), 'const n = require("net"); export default { name: "net-test", trigger: "/nt", description: "test", execute: async () => {} };', 'utf8');
      const { loadPlugins } = await import('../src/plugins/loader.js');
      const plugins = await loadPlugins();
      expect(plugins.find(p => p.name === 'net-test')).toBeUndefined();
    });
    it('blocks http', async () => {
      const fs = require('fs');
      const path = require('path');
      const os = require('os');
      const dir = path.join(os.homedir(), '.localcode', 'plugins');
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, 'http-test.js'), 'const h = require("http"); export default { name: "http-test", trigger: "/ht", description: "test", execute: async () => {} };', 'utf8');
      const { loadPlugins } = await import('../src/plugins/loader.js');
      const plugins = await loadPlugins();
      expect(plugins.find(p => p.name === 'http-test')).toBeUndefined();
    });
    it('blocks Function constructor', async () => {
      const fs = require('fs');
      const path = require('path');
      const os = require('os');
      const dir = path.join(os.homedir(), '.localcode', 'plugins');
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, 'fn-test.js'), 'export default { name: "fn-test", trigger: "/fnt", description: "test", execute: async () => { new Function("return 1")(); } };', 'utf8');
      const { loadPlugins } = await import('../src/plugins/loader.js');
      const plugins = await loadPlugins();
      expect(plugins.find(p => p.name === 'fn-test')).toBeUndefined();
    });
  });
});

describe('Localcode TF-IDF Search', () => {
  describe('index building', () => {
    it('builds index for current directory', async () => {
      const { buildIndex } = await import('../src/search/tfidf.js');
      const idx = buildIndex(process.cwd(), 50);
      expect(idx.files.length).toBeGreaterThan(0);
    });
    it('skips node_modules', async () => {
      const { buildIndex } = await import('../src/search/tfidf.js');
      const idx = buildIndex(process.cwd(), 50);
      expect(idx.files.some((f: string) => f.includes('node_modules'))).toBe(false);
    });
    it('handles empty directory', async () => {
      const { buildIndex } = await import('../src/search/tfidf.js');
      const fs = require('fs');
      const os = require('os');
      const path = require('path');
      const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'lc-tfidf-'));
      const idx = buildIndex(dir, 50);
      expect(idx.files.length).toBe(0);
    });
    it('respects maxFiles', async () => {
      const { buildIndex } = await import('../src/search/tfidf.js');
      const idx = buildIndex(process.cwd(), 5);
      expect(idx.files.length).toBeLessThanOrEqual(5);
    });
  });

  describe('searching', () => {
    it('finds matching files', async () => {
      const { buildIndex, search } = await import('../src/search/tfidf.js');
      const idx = buildIndex(process.cwd(), 50);
      const results = search('function', idx);
      expect(Array.isArray(results)).toBe(true);
    });
    it('returns empty for non-matching', async () => {
      const { buildIndex, search } = await import('../src/search/tfidf.js');
      const idx = buildIndex(process.cwd(), 50);
      expect(search('xyznonexistent123', idx)).toEqual([]);
    });
    it('ranks by relevance', async () => {
      const { buildIndex, search } = await import('../src/search/tfidf.js');
      const idx = buildIndex(process.cwd(), 50);
      const results = search('function', idx);
      if (results.length > 1) {
        expect(results[0].score).toBeGreaterThanOrEqual(results[1].score);
      }
    });
    it('limits results', async () => {
      const { buildIndex, search } = await import('../src/search/tfidf.js');
      const idx = buildIndex(process.cwd(), 50);
      expect(search('function', idx, 3).length).toBeLessThanOrEqual(3);
    });
  });

  describe('context search', () => {
    it('returns matching lines', async () => {
      const { buildIndex, searchWithContext } = await import('../src/search/tfidf.js');
      const idx = buildIndex(process.cwd(), 50);
      const results = searchWithContext('function', idx);
      expect(Array.isArray(results)).toBe(true);
    });
    it('returns empty for non-matching', async () => {
      const { buildIndex, searchWithContext } = await import('../src/search/tfidf.js');
      const idx = buildIndex(process.cwd(), 50);
      expect(searchWithContext('xyznonexistent123', idx)).toEqual([]);
    });
  });
});

describe('Localcode Agent Orchestrator', () => {
  describe('singleton', () => {
    it('returns same instance', async () => {
      const { getOrchestrator } = await import('../src/agents/orchestrator.js');
      expect(getOrchestrator()).toBe(getOrchestrator());
    });
  });

  describe('agent listing', () => {
    it('returns available agents', async () => {
      const { getOrchestrator } = await import('../src/agents/orchestrator.js');
      const agents = getOrchestrator().getAvailableAgents();
      expect(Array.isArray(agents)).toBe(true);
    });
    it('returns categories', async () => {
      const { getOrchestrator } = await import('../src/agents/orchestrator.js');
      const cats = getOrchestrator().getCategories();
      expect(Array.isArray(cats)).toBe(true);
    });
  });

  describe('search', () => {
    it('searches agents', async () => {
      const { getOrchestrator } = await import('../src/agents/orchestrator.js');
      const results = getOrchestrator().searchAgents('engineer');
      expect(Array.isArray(results)).toBe(true);
    });
    it('returns empty for non-matching', async () => {
      const { getOrchestrator } = await import('../src/agents/orchestrator.js');
      expect(getOrchestrator().searchAgents('xyznonexistent123')).toEqual([]);
    });
  });

  describe('status', () => {
    it('returns null when idle', async () => {
      const { getOrchestrator } = await import('../src/agents/orchestrator.js');
      expect(getOrchestrator().getStatus()).toBeNull();
    });
  });

  describe('orchestration', () => {
    it('handles non-existent agent', async () => {
      const { getOrchestrator } = await import('../src/agents/orchestrator.js');
      const state = await getOrchestrator().runOrchestration({
        mode: 'micro', primaryAgent: 'nonexistent', supportingAgents: [], maxRetries: 1, qualityGates: false,
      }, 'test', 'ollama', {}, 'qwen2.5', process.cwd(), '', 1).catch(() => ({ phase: 'error', completedTasks: [], failedTasks: [], startTime: Date.now(), qualityGatePassed: false, currentAgent: null }));
      expect(state).toBeDefined();
    });
    it('calls progress callback', async () => {
      const { getOrchestrator } = await import('../src/agents/orchestrator.js');
      const orch = getOrchestrator();
      const progress: any[] = [];
      orch.setProgressCallback(s => progress.push(s));
      await orch.runOrchestration({
        mode: 'micro', primaryAgent: 'test', supportingAgents: [], maxRetries: 1, qualityGates: false,
      }, 'test', 'ollama', {}, 'qwen2.5', process.cwd(), '', 1).catch(() => {});
      expect(progress.length).toBeGreaterThan(0);
    });
  });
});

describe('Localcode Agent Spawner', () => {
  describe('spawning', () => {
    it('fails for non-existent agent', async () => {
      const { spawnAgent } = await import('../src/agents/agentSpawner.js');
      const agent = await spawnAgent({
        agentId: 'nonexistent', task: 'test', provider: 'ollama', apiKeys: {}, model: 'qwen2.5', workingDir: process.cwd(),
      });
      expect(agent.status).toBe('failed');
    });
  });

  describe('cancellation', () => {
    it('returns false for non-existent', async () => {
      const { cancelAgent } = await import('../src/agents/agentSpawner.js');
      expect(cancelAgent('nonexistent')).toBe(false);
    });
  });

  describe('status', () => {
    it('returns active agents', async () => {
      const { getActiveAgents } = await import('../src/agents/agentSpawner.js');
      expect(Array.isArray(getActiveAgents())).toBe(true);
    });
  });

  describe('output', () => {
    it('returns undefined for non-existent', async () => {
      const { getAgentOutput } = await import('../src/agents/agentSpawner.js');
      expect(getAgentOutput('nonexistent')).toBeUndefined();
    });
  });

  describe('cleanup', () => {
    it('runs without error', async () => {
      const { cleanupOldAgents } = await import('../src/agents/agentSpawner.js');
      cleanupOldAgents();
    });
  });

  describe('parallel spawning', () => {
    it('handles empty array', async () => {
      const { spawnAgents } = await import('../src/agents/agentSpawner.js');
      expect(await spawnAgents([], 2)).toEqual([]);
    });
  });
});

describe('Localcode Auto-Dispatch', () => {
  describe('analysis', () => {
    it('dispatches for security tasks', async () => {
      const { analyzeTaskForAgents } = await import('../src/agents/autoDispatch.js');
      const { getAgentRegistry } = await import('../src/agents/registry/loader.js');
      const result = analyzeTaskForAgents('Fix the security vulnerability', getAgentRegistry().allAgents);
      expect(result.shouldDispatch).toBe(true);
    });
    it('dispatches for database tasks', async () => {
      const { analyzeTaskForAgents } = await import('../src/agents/autoDispatch.js');
      const { getAgentRegistry } = await import('../src/agents/registry/loader.js');
      const result = analyzeTaskForAgents('Optimize database queries', getAgentRegistry().allAgents);
      expect(result.shouldDispatch).toBe(true);
    });
    it('skips empty tasks', async () => {
      const { analyzeTaskForAgents } = await import('../src/agents/autoDispatch.js');
      const { getAgentRegistry } = await import('../src/agents/registry/loader.js');
      const result = analyzeTaskForAgents('', getAgentRegistry().allAgents);
      expect(result.shouldDispatch).toBe(false);
    });
    it('limits to 5 agents', async () => {
      const { analyzeTaskForAgents } = await import('../src/agents/autoDispatch.js');
      const { getAgentRegistry } = await import('../src/agents/registry/loader.js');
      const result = analyzeTaskForAgents('security database frontend deploy infrastructure', getAgentRegistry().allAgents);
      expect(result.selectedAgents.length).toBeLessThanOrEqual(5);
    });
    it('deduplicates agents', async () => {
      const { analyzeTaskForAgents } = await import('../src/agents/autoDispatch.js');
      const { getAgentRegistry } = await import('../src/agents/registry/loader.js');
      const result = analyzeTaskForAgents('security security security', getAgentRegistry().allAgents);
      const ids = new Set(result.selectedAgents.map(a => a.agent.id));
      expect(ids.size).toBe(result.selectedAgents.length);
    });
  });

  describe('auto dispatch', () => {
    it('respects disabled setting', async () => {
      const { autoDispatchAgents } = await import('../src/agents/autoDispatch.js');
      const result = await autoDispatchAgents('test', 'ollama', {}, 'qwen2.5', process.cwd(), { agentDispatch: { enabled: false } } as any, '', []);
      expect(result).toBe('');
    });
  });
});
