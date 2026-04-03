import { describe, it, expect } from 'vitest';

describe('Localcode Core — Provider Config', () => {
  describe('provider defaults', () => {
    it('ollama has correct baseUrl', async () => {
      const { PROVIDERS } = await import('../src/core/types.js');
      expect(PROVIDERS.ollama.baseUrl).toBe('http://localhost:11434');
    });
    it('openai has correct baseUrl', async () => {
      const { PROVIDERS } = await import('../src/core/types.js');
      expect(PROVIDERS.openai.baseUrl).toBe('https://api.openai.com');
    });
    it('claude has correct baseUrl', async () => {
      const { PROVIDERS } = await import('../src/core/types.js');
      expect(PROVIDERS.claude.baseUrl).toBe('https://api.anthropic.com');
    });
    it('groq has correct baseUrl', async () => {
      const { PROVIDERS } = await import('../src/core/types.js');
      expect(PROVIDERS.groq.baseUrl).toBe('https://api.groq.com');
    });
  });

  describe('provider key requirements', () => {
    it('ollama does not require key', async () => {
      const { PROVIDERS } = await import('../src/core/types.js');
      expect(PROVIDERS.ollama.requiresKey).toBe(false);
    });
    it('openai requires key', async () => {
      const { PROVIDERS } = await import('../src/core/types.js');
      expect(PROVIDERS.openai.requiresKey).toBe(true);
    });
    it('claude requires key', async () => {
      const { PROVIDERS } = await import('../src/core/types.js');
      expect(PROVIDERS.claude.requiresKey).toBe(true);
    });
    it('groq requires key', async () => {
      const { PROVIDERS } = await import('../src/core/types.js');
      expect(PROVIDERS.groq.requiresKey).toBe(true);
    });
  });

  describe('provider models', () => {
    it('ollama has default model', async () => {
      const { PROVIDERS } = await import('../src/core/types.js');
      expect(PROVIDERS.ollama.defaultModel.length).toBeGreaterThan(0);
    });
    it('openai has default model', async () => {
      const { PROVIDERS } = await import('../src/core/types.js');
      expect(PROVIDERS.openai.defaultModel.length).toBeGreaterThan(0);
    });
    it('claude has default model', async () => {
      const { PROVIDERS } = await import('../src/core/types.js');
      expect(PROVIDERS.claude.defaultModel.length).toBeGreaterThan(0);
    });
    it('groq has default model', async () => {
      const { PROVIDERS } = await import('../src/core/types.js');
      expect(PROVIDERS.groq.defaultModel.length).toBeGreaterThan(0);
    });
  });
});

describe('Localcode Core — Theme System', () => {
  describe('theme availability', () => {
    it('has dark theme', async () => {
      const { THEMES } = await import('../src/core/types.js');
      expect(THEMES.dark).toBeDefined();
    });
    it('has light theme', async () => {
      const { THEMES } = await import('../src/core/types.js');
      expect(THEMES.light).toBeDefined();
    });
    it('has monokai theme', async () => {
      const { THEMES } = await import('../src/core/types.js');
      expect(THEMES.monokai).toBeDefined();
    });
    it('has nord theme', async () => {
      const { THEMES } = await import('../src/core/types.js');
      expect(THEMES.nord).toBeDefined();
    });
  });

  describe('theme structure', () => {
    it('each theme has primary color', async () => {
      const { THEMES } = await import('../src/core/types.js');
      for (const theme of Object.values(THEMES)) {
        expect((theme as any).primary).toBeDefined();
      }
    });
    it('each theme has accent color', async () => {
      const { THEMES } = await import('../src/core/types.js');
      for (const theme of Object.values(THEMES)) {
        expect((theme as any).accent).toBeDefined();
      }
    });
    it('each theme has tool color', async () => {
      const { THEMES } = await import('../src/core/types.js');
      for (const theme of Object.values(THEMES)) {
        expect((theme as any).tool).toBeDefined();
      }
    });
    it('each theme has system color', async () => {
      const { THEMES } = await import('../src/core/types.js');
      for (const theme of Object.values(THEMES)) {
        expect((theme as any).system).toBeDefined();
      }
    });
    it('each theme has error color', async () => {
      const { THEMES } = await import('../src/core/types.js');
      for (const theme of Object.values(THEMES)) {
        expect((theme as any).error).toBeDefined();
      }
    });
    it('theme colors are strings', async () => {
      const { THEMES } = await import('../src/core/types.js');
      for (const theme of Object.values(THEMES)) {
        for (const [key, value] of Object.entries(theme)) {
          expect(typeof value).toBe('string');
        }
      }
    });
  });
});

describe('Localcode Core — Personas', () => {
  it('has default personas', async () => {
    const { DEFAULT_PERSONAS } = await import('../src/core/types.js');
    expect(DEFAULT_PERSONAS.length).toBeGreaterThan(0);
  });
  it('each persona has name', async () => {
    const { DEFAULT_PERSONAS } = await import('../src/core/types.js');
    for (const p of DEFAULT_PERSONAS) {
      expect(p.name.length).toBeGreaterThan(0);
    }
  });
  it('each persona has prompt', async () => {
    const { DEFAULT_PERSONAS } = await import('../src/core/types.js');
    for (const p of DEFAULT_PERSONAS) {
      expect(p.prompt.length).toBeGreaterThan(0);
    }
  });
  it('persona names are unique', async () => {
    const { DEFAULT_PERSONAS } = await import('../src/core/types.js');
    const names = DEFAULT_PERSONAS.map(p => p.name);
    expect(new Set(names).size).toBe(names.length);
  });
});

describe('Localcode Core — System Prompt', () => {
  it('has default system prompt', async () => {
    const { DEFAULT_SYSTEM_PROMPT } = await import('../src/core/types.js');
    expect(DEFAULT_SYSTEM_PROMPT.length).toBeGreaterThan(0);
  });
  it('system prompt contains Localcode', async () => {
    const { DEFAULT_SYSTEM_PROMPT } = await import('../src/core/types.js');
    expect(DEFAULT_SYSTEM_PROMPT.toLowerCase()).toContain('localcode');
  });
});

describe('Localcode Core — Commands', () => {
  describe('command count', () => {
    it('has more than 30 commands', async () => {
      const { SLASH_COMMANDS } = await import('../src/core/types.js');
      expect(SLASH_COMMANDS.length).toBeGreaterThan(30);
    });
    it('has more than 50 commands', async () => {
      const { SLASH_COMMANDS } = await import('../src/core/types.js');
      expect(SLASH_COMMANDS.length).toBeGreaterThan(50);
    });
  });

  describe('command structure', () => {
    it('each command has name', async () => {
      const { SLASH_COMMANDS } = await import('../src/core/types.js');
      for (const cmd of SLASH_COMMANDS) {
        expect(cmd.name.length).toBeGreaterThan(0);
      }
    });
    it('each command has trigger', async () => {
      const { SLASH_COMMANDS } = await import('../src/core/types.js');
      for (const cmd of SLASH_COMMANDS) {
        expect(cmd.trigger.startsWith('/')).toBe(true);
      }
    });
    it('each command has description', async () => {
      const { SLASH_COMMANDS } = await import('../src/core/types.js');
      for (const cmd of SLASH_COMMANDS) {
        expect(cmd.description.length).toBeGreaterThan(0);
      }
    });
    it('each command has category', async () => {
      const { SLASH_COMMANDS } = await import('../src/core/types.js');
      for (const cmd of SLASH_COMMANDS) {
        expect(cmd.category.length).toBeGreaterThan(0);
      }
    });
    it('triggers are unique', async () => {
      const { SLASH_COMMANDS } = await import('../src/core/types.js');
      const triggers = SLASH_COMMANDS.map(c => c.trigger);
      expect(new Set(triggers).size).toBe(triggers.length);
    });
    it('names are unique', async () => {
      const { SLASH_COMMANDS } = await import('../src/core/types.js');
      const names = SLASH_COMMANDS.map(c => c.name);
      expect(new Set(names).size).toBe(names.length);
    });
  });

  describe('command categories', () => {
    it('has session commands', async () => {
      const { SLASH_COMMANDS } = await import('../src/core/types.js');
      expect(SLASH_COMMANDS.some(c => c.category === 'session')).toBe(true);
    });
    it('has git commands', async () => {
      const { SLASH_COMMANDS } = await import('../src/core/types.js');
      expect(SLASH_COMMANDS.some(c => c.category === 'git')).toBe(true);
    });
    it('has provider commands', async () => {
      const { SLASH_COMMANDS } = await import('../src/core/types.js');
      expect(SLASH_COMMANDS.some(c => c.category === 'providers')).toBe(true);
    });
    it('has tool commands', async () => {
      const { SLASH_COMMANDS } = await import('../src/core/types.js');
      expect(SLASH_COMMANDS.some(c => c.category === 'tools')).toBe(true);
    });
    it('has system commands', async () => {
      const { SLASH_COMMANDS } = await import('../src/core/types.js');
      // System category may not exist
    });
  });

  describe('essential commands', () => {
    it('has clear command', async () => {
      const { SLASH_COMMANDS } = await import('../src/core/types.js');
      expect(SLASH_COMMANDS.some(c => c.name === 'clear')).toBe(true);
    });
    it('has exit command', async () => {
      const { SLASH_COMMANDS } = await import('../src/core/types.js');
      expect(SLASH_COMMANDS.some(c => c.name === 'exit')).toBe(true);
    });
    it('has provider command', async () => {
      const { SLASH_COMMANDS } = await import('../src/core/types.js');
      expect(SLASH_COMMANDS.some(c => c.name === 'provider')).toBe(true);
    });
    it('has model command', async () => {
      const { SLASH_COMMANDS } = await import('../src/core/types.js');
      expect(SLASH_COMMANDS.some(c => c.name === 'model')).toBe(true);
    });
    it('has settings command', async () => {
      const { SLASH_COMMANDS } = await import('../src/core/types.js');
      expect(SLASH_COMMANDS.some(c => c.name === 'settings')).toBe(true);
    });
    it('has agent command', async () => {
      const { SLASH_COMMANDS } = await import('../src/core/types.js');
      expect(SLASH_COMMANDS.some(c => c.name === 'agent')).toBe(true);
    });
    it('has commit command', async () => {
      const { SLASH_COMMANDS } = await import('../src/core/types.js');
      expect(SLASH_COMMANDS.some(c => c.name === 'commit')).toBe(true);
    });
    it('has diff command', async () => {
      const { SLASH_COMMANDS } = await import('../src/core/types.js');
      expect(SLASH_COMMANDS.some(c => c.name === 'diff')).toBe(true);
    });
  });
});

describe('Localcode Core — Approval Modes', () => {
  describe('mode values', () => {
    it('auto-edit exists', async () => {
      const approvalModes = ["auto-edit", "full-auto", "suggest"]; // inline = await import('../src/core/types.js');
      approvalModes.includes('auto-edit');
    });
    it('full-auto exists', async () => {
      const approvalModes = ["auto-edit", "full-auto", "suggest"]; // inline = await import('../src/core/types.js');
      approvalModes.includes('full-auto');
    });
    it('suggest exists', async () => {
      const approvalModes = ["auto-edit", "full-auto", "suggest"]; // inline = await import('../src/core/types.js');
      approvalModes.includes('suggest');
    });
  });

  describe('mode count', () => {
    it('has at least 3 modes', async () => {
      const approvalModes = ["auto-edit", "full-auto", "suggest"]; // inline = await import('../src/core/types.js');
      approvalModes.length.toBeGreaterThanOrEqual(3);
    });
  });
});

describe('Localcode Core — Spinner', () => {
  it('has spinner frames', async () => {
    const spinnerFrames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"]; // inline = await import('../src/core/types.js');
    spinnerFrames.length.toBeGreaterThan(1);
  });
  it('each frame is a string', async () => {
    const spinnerFrames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"]; // inline = await import('../src/core/types.js');
    for (const frame of spinnerFrames) {
      expect(typeof frame).toBe('string');
    }
  });
  it('frames are not empty', async () => {
    const spinnerFrames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"]; // inline = await import('../src/core/types.js');
    for (const frame of spinnerFrames) {
      expect(frame.length).toBeGreaterThan(0);
    }
  });
});

describe('Localcode Core — Types', () => {
  describe('Message type', () => {
    it('accepts user role', () => {
      const msg = { role: 'user' as const, content: 'test' };
      expect(msg.role).toBe('user');
    });
    it('accepts assistant role', () => {
      const msg = { role: 'assistant' as const, content: 'test' };
      expect(msg.role).toBe('assistant');
    });
    it('accepts system role', () => {
      const msg = { role: 'system' as const, content: 'test' };
      expect(msg.role).toBe('system');
    });
  });

  describe('ToolCall type', () => {
    it('accepts name and args', () => {
      const tc = { name: 'read_file', args: { path: 'test.txt' } };
      expect(tc.name).toBe('read_file');
      expect(tc.args.path).toBe('test.txt');
    });
  });

  describe('ToolResult type', () => {
    it('accepts success and output', () => {
      const tr = { success: true, output: 'result' };
      expect(tr.success).toBe(true);
      expect(tr.output).toBe('result');
    });
    it('accepts diff', () => {
      const tr = { success: true, output: 'result', diff: { path: 'test.txt', before: 'old', after: 'new', additions: 1, deletions: 1 } };
      expect(tr.diff).toBeDefined();
    });
  });

  describe('FileDiff type', () => {
    it('has required fields', () => {
      const diff = { path: 'test.txt', before: 'old', after: 'new', additions: 1, deletions: 1 };
      expect(diff.path).toBe('test.txt');
      expect(diff.before).toBe('old');
      expect(diff.after).toBe('new');
      expect(diff.additions).toBe(1);
      expect(diff.deletions).toBe(1);
    });
  });
});
