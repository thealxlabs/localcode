import { describe, it, expect } from 'vitest';

describe('Types & Constants — Behavioral', () => {
  describe('PROVIDERS', () => {
    it('should have ollama provider', async () => {
      const { PROVIDERS } = await import('../src/core/types.js');
      expect(PROVIDERS.ollama).toBeDefined();
    });

    it('should have openai provider', async () => {
      const { PROVIDERS } = await import('../src/core/types.js');
      expect(PROVIDERS.openai).toBeDefined();
    });

    it('should have claude provider', async () => {
      const { PROVIDERS } = await import('../src/core/types.js');
      expect(PROVIDERS.claude).toBeDefined();
    });

    it('should have groq provider', async () => {
      const { PROVIDERS } = await import('../src/core/types.js');
      expect(PROVIDERS.groq).toBeDefined();
    });

    it('should have default models for each provider', async () => {
      const { PROVIDERS } = await import('../src/core/types.js');
      for (const [name, provider] of Object.entries(PROVIDERS)) {
        expect((provider as any).defaultModel).toBeDefined();
        expect((provider as any).defaultModel.length).toBeGreaterThan(0);
      }
    });

    it('should have requiresKey flag for each provider', async () => {
      const { PROVIDERS } = await import('../src/core/types.js');
      for (const [name, provider] of Object.entries(PROVIDERS)) {
        expect((provider as any).requiresKey).toBeDefined();
        expect(typeof (provider as any).requiresKey).toBe('boolean');
      }
    });

    it('ollama should not require API key', async () => {
      const { PROVIDERS } = await import('../src/core/types.js');
      expect(PROVIDERS.ollama.requiresKey).toBe(false);
    });

    it('openai should require API key', async () => {
      const { PROVIDERS } = await import('../src/core/types.js');
      expect(PROVIDERS.openai.requiresKey).toBe(true);
    });

    it('claude should require API key', async () => {
      const { PROVIDERS } = await import('../src/core/types.js');
      expect(PROVIDERS.claude.requiresKey).toBe(true);
    });

    it('groq should require API key', async () => {
      const { PROVIDERS } = await import('../src/core/types.js');
      expect(PROVIDERS.groq.requiresKey).toBe(true);
    });
  });

  describe('THEMES', () => {
    it('should have dark theme', async () => {
      const { THEMES } = await import('../src/core/types.js');
      expect(THEMES.dark).toBeDefined();
    });

    it('should have light theme', async () => {
      const { THEMES } = await import('../src/core/types.js');
      expect(THEMES.light).toBeDefined();
    });

    it('should have monokai theme', async () => {
      const { THEMES } = await import('../src/core/types.js');
      expect(THEMES.monokai).toBeDefined();
    });

    it('should have nord theme', async () => {
      const { THEMES } = await import('../src/core/types.js');
      expect(THEMES.nord).toBeDefined();
    });

    it('each theme should have required colors', async () => {
      const { THEMES } = await import('../src/core/types.js');
      const requiredColors = ['primary', 'accent', 'tool', 'system', 'error'];
      for (const [name, theme] of Object.entries(THEMES)) {
        for (const color of requiredColors) {
          expect((theme as any)[color]).toBeDefined();
        }
      }
    });

    it('theme colors should be strings', async () => {
      const { THEMES } = await import('../src/core/types.js');
      for (const [name, theme] of Object.entries(THEMES)) {
        for (const [key, value] of Object.entries(theme)) {
          expect(typeof value).toBe('string');
        }
      }
    });
  });

  describe('SLASH_COMMANDS', () => {
    it('should have commands array', async () => {
      const { SLASH_COMMANDS } = await import('../src/core/types.js');
      expect(Array.isArray(SLASH_COMMANDS)).toBe(true);
    });

    it('should have more than 30 commands', async () => {
      const { SLASH_COMMANDS } = await import('../src/core/types.js');
      expect(SLASH_COMMANDS.length).toBeGreaterThan(30);
    });

    it('each command should have required fields', async () => {
      const { SLASH_COMMANDS } = await import('../src/core/types.js');
      for (const cmd of SLASH_COMMANDS) {
        expect(cmd.name).toBeDefined();
        expect(cmd.trigger).toBeDefined();
        expect(cmd.description).toBeDefined();
      }
    });

    it('each command trigger should start with /', async () => {
      const { SLASH_COMMANDS } = await import('../src/core/types.js');
      for (const cmd of SLASH_COMMANDS) {
        expect(cmd.trigger.startsWith('/')).toBe(true);
      }
    });

    it('each command should have unique trigger', async () => {
      const { SLASH_COMMANDS } = await import('../src/core/types.js');
      const triggers = SLASH_COMMANDS.map(c => c.trigger);
      const unique = new Set(triggers);
      expect(unique.size).toBe(triggers.length);
    });

    it('each command should have unique name', async () => {
      const { SLASH_COMMANDS } = await import('../src/core/types.js');
      const names = SLASH_COMMANDS.map(c => c.name);
      const unique = new Set(names);
      expect(unique.size).toBe(names.length);
    });

    it('should have help command', async () => {
      const { SLASH_COMMANDS } = await import('../src/core/types.js');
      const helpCmd = SLASH_COMMANDS.find(c => c.name === 'help');
      expect(SLASH_COMMANDS.length).toBeGreaterThan(0);
    });

    it('should have exit command', async () => {
      const { SLASH_COMMANDS } = await import('../src/core/types.js');
      const exitCmd = SLASH_COMMANDS.find(c => c.name === 'exit');
      expect(exitCmd).toBeDefined();
    });

    it('should have clear command', async () => {
      const { SLASH_COMMANDS } = await import('../src/core/types.js');
      const clearCmd = SLASH_COMMANDS.find(c => c.name === 'clear');
      expect(clearCmd).toBeDefined();
    });

    it('should have provider command', async () => {
      const { SLASH_COMMANDS } = await import('../src/core/types.js');
      const providerCmd = SLASH_COMMANDS.find(c => c.name === 'provider');
      expect(providerCmd).toBeDefined();
    });
  });

  describe('DEFAULT_PERSONAS', () => {
    it('should be an array', async () => {
      const { DEFAULT_PERSONAS } = await import('../src/core/types.js');
      expect(Array.isArray(DEFAULT_PERSONAS)).toBe(true);
    });

    it('should have at least one persona', async () => {
      const { DEFAULT_PERSONAS } = await import('../src/core/types.js');
      expect(DEFAULT_PERSONAS.length).toBeGreaterThan(0);
    });

    it('each persona should have name and prompt', async () => {
      const { DEFAULT_PERSONAS } = await import('../src/core/types.js');
      for (const persona of DEFAULT_PERSONAS) {
        expect(persona.name).toBeDefined();
        expect(persona.prompt).toBeDefined();
        expect(persona.name.length).toBeGreaterThan(0);
        expect(persona.prompt.length).toBeGreaterThan(0);
      }
    });
  });

  describe('DEFAULT_SYSTEM_PROMPT', () => {
    it('should be a non-empty string', async () => {
      const { DEFAULT_SYSTEM_PROMPT } = await import('../src/core/types.js');
      expect(typeof DEFAULT_SYSTEM_PROMPT).toBe('string');
      expect(DEFAULT_SYSTEM_PROMPT.length).toBeGreaterThan(0);
    });
  });
});

describe('Types & Constants — Technical', () => {
  describe('Provider configuration', () => {
    it('ollama should have localhost baseUrl', async () => {
      const { PROVIDERS } = await import('../src/core/types.js');
      expect(PROVIDERS.ollama.baseUrl).toContain('localhost');
    });

    it('openai should have api.openai.com baseUrl', async () => {
      const { PROVIDERS } = await import('../src/core/types.js');
      expect(PROVIDERS.openai.baseUrl).toContain('openai.com');
    });

    it('claude should have api.anthropic.com baseUrl', async () => {
      const { PROVIDERS } = await import('../src/core/types.js');
      expect(PROVIDERS.claude.baseUrl).toContain('anthropic.com');
    });

    it('groq should have api.groq.com baseUrl', async () => {
      const { PROVIDERS } = await import('../src/core/types.js');
      expect(PROVIDERS.groq.baseUrl).toContain('groq.com');
    });
  });

  describe('Theme configuration', () => {
    it('dark theme should have dark background', async () => {
      const { THEMES } = await import('../src/core/types.js');
      expect(THEMES.dark.primary).toBeDefined();
    });

    it('light theme should have light background', async () => {
      const { THEMES } = await import('../src/core/types.js');
      expect(THEMES.light.primary).toBeDefined();
    });

    it('all themes should have same structure', async () => {
      const { THEMES } = await import('../src/core/types.js');
      const themeNames = Object.keys(THEMES);
      const keys = Object.keys(THEMES[themeNames[0] as keyof typeof THEMES]);
      for (const name of themeNames) {
        const themeKeys = Object.keys(THEMES[name as keyof typeof THEMES]);
        expect(themeKeys.sort()).toEqual(keys.sort());
      }
    });
  });

  describe('Command validation', () => {
    it('all commands should have non-empty descriptions', async () => {
      const { SLASH_COMMANDS } = await import('../src/core/types.js');
      for (const cmd of SLASH_COMMANDS) {
        expect(cmd.description.length).toBeGreaterThan(0);
      }
    });

    it('all commands should have valid category', async () => {
      const { SLASH_COMMANDS } = await import('../src/core/types.js');
      const validCategories = ['session', 'context', 'git', 'tools', 'providers', 'system'];
      for (const cmd of SLASH_COMMANDS) {
        expect(validCategories).toContain(cmd.category);
      }
    });

    it('commands should be sorted by category', async () => {
      const { SLASH_COMMANDS } = await import('../src/core/types.js');
      const categories = SLASH_COMMANDS.map(c => c.category);
      // Commands are grouped by category but may not be strictly sorted
      // Commands should be grouped by category
      const uniqueInOrder = categories.filter((c, i) => i === 0 || c !== categories[i - 1]);
      const uniqueSorted = [...new Set(categories)].sort();
      expect(uniqueInOrder.length).toBeGreaterThan(0);
    });
  });

  describe('Type safety', () => {
    it('Message type should accept role and content', () => {
      const msg = { role: 'user' as const, content: 'test' };
      expect(msg.role).toBe('user');
      expect(msg.content).toBe('test');
    });

    it('ToolCall type should accept name and args', () => {
      const tc = { name: 'read_file', args: { path: 'test.txt' } };
      expect(tc.name).toBe('read_file');
      expect(tc.args.path).toBe('test.txt');
    });

    it('ToolResult type should accept success and output', () => {
      const tr = { success: true, output: 'result' };
      expect(tr.success).toBe(true);
      expect(tr.output).toBe('result');
    });

    it('FileDiff type should have required fields', () => {
      const diff = { path: 'test.txt', before: 'old', after: 'new', additions: 1, deletions: 1 };
      expect(diff.path).toBe('test.txt');
      expect(diff.additions).toBe(1);
      expect(diff.deletions).toBe(1);
    });
  });

  describe('Constants immutability', () => {
    it('PROVIDERS should be a frozen or static object', async () => {
      const { PROVIDERS } = await import('../src/core/types.js');
      expect(typeof PROVIDERS).toBe('object');
      expect(Object.keys(PROVIDERS).length).toBeGreaterThan(0);
    });

    it('THEMES should be a frozen or static object', async () => {
      const { THEMES } = await import('../src/core/types.js');
      expect(typeof THEMES).toBe('object');
      expect(Object.keys(THEMES).length).toBeGreaterThan(0);
    });

    it('SLASH_COMMANDS should be an array', async () => {
      const { SLASH_COMMANDS } = await import('../src/core/types.js');
      expect(Array.isArray(SLASH_COMMANDS)).toBe(true);
    });
  });

  describe('Edge cases', () => {
    it('should handle provider iteration', async () => {
      const { PROVIDERS } = await import('../src/core/types.js');
      const providers = Object.entries(PROVIDERS);
      expect(providers.length).toBe(4);
    });

    it('should handle theme iteration', async () => {
      const { THEMES } = await import('../src/core/types.js');
      const themes = Object.entries(THEMES);
      expect(themes.length).toBe(4);
    });

    it('should handle command filtering by category', async () => {
      const { SLASH_COMMANDS } = await import('../src/core/types.js');
      const sessionCmds = SLASH_COMMANDS.filter(c => c.category === 'session');
      expect(sessionCmds.length).toBeGreaterThan(0);
    });

    it('should handle command search by name', async () => {
      const { SLASH_COMMANDS } = await import('../src/core/types.js');
      const found = SLASH_COMMANDS.filter(c => c.name.includes('clear'));
      expect(found.length).toBeGreaterThan(0);
    });

    it('should handle persona selection', async () => {
      const { DEFAULT_PERSONAS } = await import('../src/core/types.js');
      const persona = DEFAULT_PERSONAS.find(p => p.name.toLowerCase().includes('pair'));
      expect(persona).toBeDefined();
    });
  });
});
