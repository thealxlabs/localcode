import { describe, it, expect } from 'vitest';

describe('Localcode Session Management', () => {
  describe('session state', () => {
    it('loads with ollama provider', async () => {
      const { loadSession } = await import('../src/sessions/manager.js');
      const s = loadSession();
      expect(s.provider).toBe('ollama');
    });
    it('has empty messages by default', async () => {
      const { loadSession } = await import('../src/sessions/manager.js');
      const s = loadSession();
      expect(s.messages).toEqual([]);
    });
    it('has empty checkpoints by default', async () => {
      const { loadSession } = await import('../src/sessions/manager.js');
      const s = loadSession();
      expect(s.checkpoints).toEqual([]);
    });
    it('has workingDir set', async () => {
      const { loadSession } = await import('../src/sessions/manager.js');
      const s = loadSession();
      expect(s.workingDir.length).toBeGreaterThan(0);
    });
    it('has systemPrompt set', async () => {
      const { loadSession } = await import('../src/sessions/manager.js');
      const s = loadSession();
      expect(s.systemPrompt.length).toBeGreaterThan(0);
    });
    it('has maxSteps set', async () => {
      const { loadSession } = await import('../src/sessions/manager.js');
      const s = loadSession();
      expect(s.maxSteps).toBeGreaterThan(0);
    });
    it('has sessionCost at zero', async () => {
      const { loadSession } = await import('../src/sessions/manager.js');
      const s = loadSession();
      expect(s.sessionCost).toBe(0);
    });
    it('has apiKeys object', async () => {
      const { loadSession } = await import('../src/sessions/manager.js');
      const s = loadSession();
      expect(typeof s.apiKeys).toBe('object');
    });
    it('has theme set', async () => {
      const { loadSession } = await import('../src/sessions/manager.js');
      const s = loadSession();
      expect(s.theme).toBeDefined();
    });
    it('has personas array', async () => {
      const { loadSession } = await import('../src/sessions/manager.js');
      const s = loadSession();
      expect(Array.isArray(s.personas)).toBe(true);
    });
  });

  describe('session save/load', () => {
    it('saves and loads provider', async () => {
      const { loadSession, saveSession } = await import('../src/sessions/manager.js');
      const s = loadSession();
      s.provider = 'openai';
      saveSession(s);
      expect(loadSession().provider).toBe('openai');
    });
    it('saves and loads model', async () => {
      const { loadSession, saveSession } = await import('../src/sessions/manager.js');
      const s = loadSession();
      s.model = 'test-model';
      saveSession(s);
      expect(loadSession().model).toBe('test-model');
    });
    it('saves and loads theme', async () => {
      const { loadSession, saveSession } = await import('../src/sessions/manager.js');
      const s = loadSession();
      s.theme = 'nord';
      saveSession(s);
      expect(loadSession().theme).toBe('nord');
    });
    it('saves and loads maxSteps', async () => {
      const { loadSession, saveSession } = await import('../src/sessions/manager.js');
      const s = loadSession();
      s.maxSteps = 50;
      saveSession(s);
      expect(loadSession().maxSteps).toBe(50);
    });
    it('saves and loads systemPrompt', async () => {
      const { loadSession, saveSession } = await import('../src/sessions/manager.js');
      const s = loadSession();
      s.systemPrompt = 'custom prompt';
      saveSession(s);
      expect(loadSession().systemPrompt).toBe('custom prompt');
    });
  });

  describe('session history', () => {
    it('lists sessions', async () => {
      const { listSessions } = await import('../src/sessions/manager.js');
      const sessions = listSessions();
      expect(Array.isArray(sessions)).toBe(true);
    });
    it('returns null for non-existent ID', async () => {
      const { loadSessionById } = await import('../src/sessions/manager.js');
      expect(loadSessionById('nonexistent')).toBeNull();
    });
  });

  describe('checkpoints', () => {
    it('creates checkpoint with label', async () => {
      const { createCheckpoint, loadSession } = await import('../src/sessions/manager.js');
      const s = loadSession();
      s.messages = [{ role: 'user' as const, content: 'test' }];
      const { checkpoint } = createCheckpoint(s, 'test-label');
      expect(checkpoint.label).toBe('test-label');
    });
    it('creates checkpoint with messages', async () => {
      const { createCheckpoint, loadSession } = await import('../src/sessions/manager.js');
      const s = loadSession();
      s.messages = [{ role: 'user' as const, content: 'msg1' }, { role: 'assistant' as const, content: 'msg2' }];
      const { checkpoint } = createCheckpoint(s, 'msg-test');
      expect(checkpoint.messages.length).toBe(2);
    });
    it('creates checkpoint with unique ID', async () => {
      const { createCheckpoint, loadSession } = await import('../src/sessions/manager.js');
      const s = loadSession();
      const { checkpoint: cp1 } = createCheckpoint(s, 'cp1');
      const { checkpoint: cp2 } = createCheckpoint(s, 'cp2');
      expect(cp1.id).not.toBe(cp2.id);
    });
    it('creates checkpoint with timestamp', async () => {
      const { createCheckpoint, loadSession } = await import('../src/sessions/manager.js');
      const s = loadSession();
      const before = Date.now();
      const { checkpoint } = createCheckpoint(s, 'time-test');
      expect(checkpoint.timestamp).toBeGreaterThanOrEqual(before);
    });
  });
});

describe('Localcode Settings', () => {
  describe('default settings', () => {
    it('loads without error', async () => {
      const { loadSettings } = await import('../src/settings/manager.js');
      const s = loadSettings();
      expect(s).toBeDefined();
    });
    it('has provider config', async () => {
      const { loadSettings } = await import('../src/settings/manager.js');
      const s = loadSettings();
      expect(s.provider).toBeDefined();
    });
    it('has agentDispatch config', async () => {
      const { loadSettings } = await import('../src/settings/manager.js');
      const s = loadSettings();
      expect(s.agentDispatch).toBeDefined();
    });
    it('has permissions config', async () => {
      const { loadSettings } = await import('../src/settings/manager.js');
      const s = loadSettings();
      expect(s.permissions).toBeDefined();
    });
    it('has UI config', async () => {
      const { loadSettings } = await import('../src/settings/manager.js');
      const s = loadSettings();
      expect(s.ui).toBeDefined();
    });
    it('has session config', async () => {
      const { loadSettings } = await import('../src/settings/manager.js');
      const s = loadSettings();
      expect(s.session).toBeDefined();
    });
    it('has tools config', async () => {
      const { loadSettings } = await import('../src/settings/manager.js');
      const s = loadSettings();
      expect(s.tools).toBeDefined();
    });
    it('has git config', async () => {
      const { loadSettings } = await import('../src/settings/manager.js');
      const s = loadSettings();
      expect(s.git).toBeDefined();
    });
    it('has memory config', async () => {
      const { loadSettings } = await import('../src/settings/manager.js');
      const s = loadSettings();
      expect(s.memory).toBeDefined();
    });
    it('has analytics config', async () => {
      const { loadSettings } = await import('../src/settings/manager.js');
      const s = loadSettings();
      expect(s.analytics).toBeDefined();
    });
    it('has MCP config', async () => {
      const { loadSettings } = await import('../src/settings/manager.js');
      const s = loadSettings();
      expect(s.mcp).toBeDefined();
    });
  });

  describe('settings operations', () => {
    it('gets setting with dot path', async () => {
      const { getSetting } = await import('../src/settings/manager.js');
      const val = getSetting('provider.provider', 'default');
      expect(typeof val).toBe('string');
    });
    it('returns default for missing path', async () => {
      const { getSetting } = await import('../src/settings/manager.js');
      expect(getSetting('nonexistent.path', 'fallback')).toBe('fallback');
    });
    it('exports settings as JSON', async () => {
      const { exportSettings } = await import('../src/settings/manager.js');
      const json = exportSettings();
      const parsed = JSON.parse(json);
      expect(parsed.provider).toBeDefined();
    });
    it('imports valid settings', async () => {
      const { importSettings } = await import('../src/settings/manager.js');
      expect(importSettings(JSON.stringify({ provider: { provider: 'ollama' } }))).toBe(true);
    });
    it('rejects invalid JSON', async () => {
      const { importSettings } = await import('../src/settings/manager.js');
      expect(importSettings('not json')).toBe(false);
    });
    it('generates summary', async () => {
      const { getSettingsSummary } = await import('../src/settings/manager.js');
      const summary = getSettingsSummary();
      expect(summary.length).toBeGreaterThan(0);
    });
  });
});

describe('Localcode MCP Manager', () => {
  describe('initialization', () => {
    it('creates manager without error', async () => {
      const { McpManager } = await import('../src/mcp/manager.js');
      const mgr = new McpManager();
      expect(mgr).toBeDefined();
    });
    it('starts with no servers', async () => {
      const { McpManager } = await import('../src/mcp/manager.js');
      const mgr = new McpManager();
      expect(mgr.getStatus()).toEqual([]);
    });
    it('returns empty configs', async () => {
      const { McpManager } = await import('../src/mcp/manager.js');
      const mgr = new McpManager();
      expect(mgr.getConfigs()).toEqual([]);
    });
    it('returns empty tools', async () => {
      const { McpManager } = await import('../src/mcp/manager.js');
      const mgr = new McpManager();
      expect(mgr.getAllTools()).toEqual([]);
    });
    it('returns empty tool definitions', async () => {
      const { McpManager } = await import('../src/mcp/manager.js');
      const mgr = new McpManager();
      expect(mgr.getToolDefinitions()).toEqual([]);
    });
  });

  describe('tool name checks', () => {
    it('identifies MCP tools', async () => {
      const { McpManager } = await import('../src/mcp/manager.js');
      const mgr = new McpManager();
      expect(mgr.isMcpTool('mcp__server__tool')).toBe(true);
    });
    it('rejects non-MCP tools', async () => {
      const { McpManager } = await import('../src/mcp/manager.js');
      const mgr = new McpManager();
      expect(mgr.isMcpTool('read_file')).toBe(false);
    });
    it('handles edge cases', async () => {
      const { McpManager } = await import('../src/mcp/manager.js');
      const mgr = new McpManager();
      expect(mgr.isMcpTool('')).toBe(false);
      expect(mgr.isMcpTool('mcp')).toBe(false);
    });
  });

  describe('tool call rejection', () => {
    it('rejects invalid tool names', async () => {
      const { McpManager } = await import('../src/mcp/manager.js');
      const mgr = new McpManager();
      const result = await mgr.callTool('invalid', {});
      expect(result.success).toBe(false);
    });
    it('rejects unconnected servers', async () => {
      const { McpManager } = await import('../src/mcp/manager.js');
      const mgr = new McpManager();
      const result = await mgr.callTool('mcp__nonexistent__tool', {});
      expect(result.success).toBe(false);
    });
  });

  describe('lifecycle', () => {
    it('disposes without error', async () => {
      const { McpManager } = await import('../src/mcp/manager.js');
      const mgr = new McpManager();
      mgr.dispose();
    });
    it('runs health check without error', async () => {
      const { McpManager } = await import('../src/mcp/manager.js');
      const mgr = new McpManager();
      await mgr.healthCheck();
    });
  });
});

describe('Localcode Agent Registry', () => {
  describe('registry building', () => {
    it('builds registry', async () => {
      const { buildAgentRegistry } = await import('../src/agents/registry/loader.js');
      const reg = buildAgentRegistry();
      expect(reg).toBeDefined();
    });
    it('has categories', async () => {
      const { buildAgentRegistry } = await import('../src/agents/registry/loader.js');
      const reg = buildAgentRegistry();
      expect(Array.isArray(reg.categories)).toBe(true);
    });
    it('has allAgents', async () => {
      const { buildAgentRegistry } = await import('../src/agents/registry/loader.js');
      const reg = buildAgentRegistry();
      expect(Array.isArray(reg.allAgents)).toBe(true);
    });
  });

  describe('agent lookup', () => {
    it('returns undefined for missing agent', async () => {
      const { getAgentRegistry } = await import('../src/agents/registry/loader.js');
      const reg = getAgentRegistry();
      expect(reg.getAgent('nonexistent')).toBeUndefined();
    });
    it('returns agents by category', async () => {
      const { getAgentRegistry } = await import('../src/agents/registry/loader.js');
      const reg = getAgentRegistry();
      expect(Array.isArray(reg.getAgentsByCategory('engineering'))).toBe(true);
    });
    it('searches agents', async () => {
      const { getAgentRegistry } = await import('../src/agents/registry/loader.js');
      const reg = getAgentRegistry();
      expect(Array.isArray(reg.searchAgents('engineer'))).toBe(true);
    });
  });
});

describe('Localcode Logger', () => {
  describe('log levels', () => {
    it('logs debug', async () => {
      const { logger, setLogLevel } = await import('../src/core/logger.js');
      setLogLevel('debug');
      logger.debug('test');
    });
    it('logs info', async () => {
      const { logger } = await import('../src/core/logger.js');
      logger.info('test');
    });
    it('logs warn', async () => {
      const { logger } = await import('../src/core/logger.js');
      logger.warn('test');
    });
    it('logs error', async () => {
      const { logger } = await import('../src/core/logger.js');
      logger.error('test');
    });
  });

  describe('log output', () => {
    it('handles context', async () => {
      const { logger } = await import('../src/core/logger.js');
      logger.info('test', { key: 'value' });
    });
    it('handles empty context', async () => {
      const { logger } = await import('../src/core/logger.js');
      logger.info('test', {});
    });
    it('handles no context', async () => {
      const { logger } = await import('../src/core/logger.js');
      logger.info('test');
    });
  });
});
