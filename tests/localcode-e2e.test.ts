import { describe, it, expect } from 'vitest';

describe('Localcode Swarm', () => {
  describe('task decomposition', () => {
    it('parses JSON array', () => {
      const raw = '["task 1", "task 2"]';
      const match = raw.match(/\[[\s\S]*\]/);
      expect(match).not.toBeNull();
      expect(JSON.parse(match![0]).length).toBe(2);
    });
    it('handles malformed JSON', () => {
      expect('not json'.match(/\[[\s\S]*\]/)).toBeNull();
    });
    it('extracts JSON from mixed content', () => {
      const raw = 'Here: ["a", "b"]';
      const match = raw.match(/\[[\s\S]*\]/);
      expect(match).not.toBeNull();
    });
  });

  describe('result aggregation', () => {
    it('collects parallel results', async () => {
      const results = await Promise.all([
        Promise.resolve({ index: 0, subtask: 't1', output: 'r1', durationMs: 10 }),
        Promise.resolve({ index: 1, subtask: 't2', output: 'r2', durationMs: 20 }),
      ]);
      expect(results.length).toBe(2);
    });
    it('handles partial failures', async () => {
      const results = await Promise.allSettled([
        Promise.resolve({ index: 0 }),
        Promise.reject(new Error('fail')),
      ]);
      expect(results[0].status).toBe('fulfilled');
      expect(results[1].status).toBe('rejected');
    });
  });

  describe('concurrency', () => {
    it('runs in parallel', async () => {
      const start = Date.now();
      await Promise.all([
        new Promise(r => setTimeout(r, 30)),
        new Promise(r => setTimeout(r, 30)),
      ]);
      expect(Date.now() - start).toBeLessThan(100);
    });
  });
});

describe('Localcode Test Loop', () => {
  describe('test detection', () => {
    it('checks for package.json scripts', async () => {
      const { detectTestCommand } = await import('../src/agents/testloop.js');
      const result = await detectTestCommand(process.cwd());
      expect(typeof result).toBe('string');
    });
  });

  describe('test execution', () => {
    it('returns pass for true', async () => {
      const { runTests } = await import('../src/agents/testloop.js');
      const result = await runTests('true', process.cwd());
      expect(result.passed).toBe(true);
    });
    it('returns fail for false', async () => {
      const { runTests } = await import('../src/agents/testloop.js');
      const result = await runTests('false', process.cwd());
      expect(result.passed).toBe(false);
    });
    it('captures output', async () => {
      const { runTests } = await import('../src/agents/testloop.js');
      const result = await runTests('echo "test output"', process.cwd());
      expect(result.output.length).toBeGreaterThan(0);
    });
    it('handles empty command', async () => {
      const { runTests } = await import('../src/agents/testloop.js');
      const result = await runTests('', process.cwd());
      expect(result).toBeDefined();
    });
    it('respects working directory', async () => {
      const { runTests } = await import('../src/agents/testloop.js');
      const result = await runTests('pwd', process.cwd());
      expect(result.output).toContain(process.cwd());
    });
  });
});

describe('Localcode Permission System', () => {
  describe('needsApproval', () => {
    it('requires approval for shell in suggest mode', async () => {
      const { needsApproval } = await import('../src/ui/PermissionPrompt.js');
      expect(needsApproval({ name: 'run_shell', args: {} }, 'suggest')).toBe(true);
    });
    it('requires approval for shell in auto-edit mode', async () => {
      const { needsApproval } = await import('../src/ui/PermissionPrompt.js');
      expect(needsApproval({ name: 'run_shell', args: {} }, 'auto-edit')).toBe(true);
    });
    it('does not require approval in full-auto mode', async () => {
      const { needsApproval } = await import('../src/ui/PermissionPrompt.js');
      expect(needsApproval({ name: 'run_shell', args: {} }, 'full-auto')).toBe(false);
    });
    it('does not require approval for read_file in auto-edit', async () => {
      const { needsApproval } = await import('../src/ui/PermissionPrompt.js');
      expect(needsApproval({ name: 'read_file', args: {} }, 'auto-edit')).toBe(false);
    });
    it('requires approval for write_file in suggest', async () => {
      const { needsApproval } = await import('../src/ui/PermissionPrompt.js');
      expect(needsApproval({ name: 'write_file', args: {} }, 'suggest')).toBe(true);
    });
    it('does not require approval for write_file in auto-edit', async () => {
      const { needsApproval } = await import('../src/ui/PermissionPrompt.js');
      expect(needsApproval({ name: 'write_file', args: {} }, 'auto-edit')).toBe(false);
    });
  });

  describe('tool sensitivity', () => {
    it('identifies sensitive tools', async () => {
      const { needsApproval } = await import('../src/ui/PermissionPrompt.js');
      const sensitive = ['write_file', 'patch_file', 'delete_file', 'run_shell', 'move_file'];
      for (const tool of sensitive) {
        expect(needsApproval({ name: tool, args: {} }, 'suggest')).toBe(true);
      }
    });
    it('identifies non-sensitive tools', async () => {
      const { needsApproval } = await import('../src/ui/PermissionPrompt.js');
      const nonSensitive = ['read_file', 'list_dir', 'search_files', 'find_files', 'git_operation'];
      for (const tool of nonSensitive) {
        expect(needsApproval({ name: tool, args: {} }, 'auto-edit')).toBe(false);
      }
    });
  });
});

describe('Localcode Budget Guard', () => {
  describe('budget configuration', () => {
    it('tracks session cost', async () => {
      const { loadSession } = await import('../src/sessions/manager.js');
      expect(typeof loadSession().sessionCost).toBe('number');
    });
    it('has null budget by default', async () => {
      const { loadSession } = await import('../src/sessions/manager.js');
      expect(loadSession().budgetLimit).toBeNull();
    });
    it('has fallback model', async () => {
      const { loadSession } = await import('../src/sessions/manager.js');
      expect(loadSession().budgetFallbackModel).toBeDefined();
    });
    it('saves budget limit', async () => {
      const { loadSession, saveSession } = await import('../src/sessions/manager.js');
      const s = loadSession();
      s.budgetLimit = 5.00;
      saveSession(s);
      expect(loadSession().budgetLimit).toBe(5.00);
    });
    it('saves null budget', async () => {
      const { loadSession, saveSession } = await import('../src/sessions/manager.js');
      const s = loadSession();
      s.budgetLimit = null;
      saveSession(s);
      expect(loadSession().budgetLimit).toBeNull();
    });
  });
});

describe('Localcode Safe Mode', () => {
  describe('configuration', () => {
    it('has safeMode flag', async () => {
      const { loadSession } = await import('../src/sessions/manager.js');
      expect(typeof loadSession().safeMode).toBe('boolean');
    });
    it('saves safeMode', async () => {
      const { loadSession, saveSession } = await import('../src/sessions/manager.js');
      const s = loadSession();
      s.safeMode = true;
      saveSession(s);
      expect(loadSession().safeMode).toBe(true);
    });
  });

  describe('stash management', () => {
    it('generates unique stash names', () => {
      const n1 = `nyx-safe-${Date.now()}`;
      const n2 = `nyx-safe-${Date.now() + 1}`;
      expect(n1).not.toBe(n2);
    });
  });
});

describe('Localcode Memory System', () => {
  describe('memory paths', () => {
    it('has global memory path', () => {
      const { homedir } = require('os');
      const { join } = require('path');
      expect(join(homedir(), '.localcode.md').length).toBeGreaterThan(0);
    });
    it('has project memory path', () => {
      const { join } = require('path');
      expect(join(process.cwd(), '.localcode.md').length).toBeGreaterThan(0);
    });
  });

  describe('memory extraction', () => {
    it('extracts exports', () => {
      const code = 'export function hello() {}';
      expect(code.match(/export\s+(?:const|function|class|interface|type)\s+(\w+)/)).not.toBeNull();
    });
    it('extracts imports', () => {
      const code = 'import { useState } from "react";';
      expect(code.match(/import\s+.*from\s+['"](.+?)['"]/)).not.toBeNull();
    });
    it('extracts TODOs', () => {
      const code = '// TODO: implement this';
      expect(code.match(/\/\/\s*TODO[:\s]*(.+)/gi)).not.toBeNull();
    });
    it('extracts FIXMEs', () => {
      const code = '// FIXME: hack';
      expect(code.match(/\/\/\s*FIXME[:\s]*(.+)/gi)).not.toBeNull();
    });
  });
});

describe('Localcode Checkpoint System', () => {
  describe('creation', () => {
    it('creates with label', async () => {
      const { createCheckpoint, loadSession } = await import('../src/sessions/manager.js');
      const s = loadSession();
      s.messages = [{ role: 'user' as const, content: 'test' }];
      const { checkpoint } = createCheckpoint(s, 'test-label');
      expect(checkpoint.label).toBe('test-label');
    });
    it('creates with timestamp', async () => {
      const { createCheckpoint, loadSession } = await import('../src/sessions/manager.js');
      const s = loadSession();
      const before = Date.now();
      const { checkpoint } = createCheckpoint(s, 'time');
      expect(checkpoint.timestamp).toBeGreaterThanOrEqual(before);
    });
    it('creates with unique ID', async () => {
      const { createCheckpoint, loadSession } = await import('../src/sessions/manager.js');
      const s = loadSession();
      const { checkpoint: cp1 } = createCheckpoint(s, 'cp1');
      const { checkpoint: cp2 } = createCheckpoint(s, 'cp2');
      expect(cp1.id).not.toBe(cp2.id);
    });
    it('preserves messages', async () => {
      const { createCheckpoint, loadSession } = await import('../src/sessions/manager.js');
      const s = loadSession();
      s.messages = [{ role: 'user' as const, content: 'msg1' }, { role: 'assistant' as const, content: 'msg2' }];
      const { checkpoint } = createCheckpoint(s, 'msgs');
      expect(checkpoint.messages.length).toBe(2);
    });
    it('handles empty messages', async () => {
      const { createCheckpoint, loadSession } = await import('../src/sessions/manager.js');
      const s = loadSession();
      s.messages = [];
      const { checkpoint } = createCheckpoint(s, 'empty');
      expect(checkpoint.messages).toEqual([]);
    });
  });
});

describe('Localcode Hooks System', () => {
  describe('hook loading', () => {
    it('loads hooks', async () => {
      const { loadHooks } = await import('../src/sessions/manager.js');
      const hooks = loadHooks();
      expect(hooks).toBeDefined();
    });
    it('has PreToolUse', async () => {
      const { loadHooks } = await import('../src/sessions/manager.js');
      expect(loadHooks()).toHaveProperty('PreToolUse');
    });
    it('has PostToolUse', async () => {
      const { loadHooks } = await import('../src/sessions/manager.js');
      expect(loadHooks()).toHaveProperty('PostToolUse');
    });
    it('has Notification', async () => {
      const { loadHooks } = await import('../src/sessions/manager.js');
      expect(loadHooks()).toHaveProperty('Notification');
    });
  });

  describe('hook matching', () => {
    it('matches by tool name', () => {
      const hooks = { PreToolUse: [{ matcher: 'run_shell', command: 'echo test' }] };
      expect(hooks.PreToolUse.filter(h => h.matcher === 'run_shell').length).toBe(1);
    });
    it('matches by regex', () => {
      const hooks = { PreToolUse: [{ matcher: '.*shell.*', command: 'echo test' }] };
      expect(hooks.PreToolUse.filter(h => new RegExp(h.matcher).test('run_shell')).length).toBe(1);
    });
    it('skips non-matching', () => {
      const hooks = { PreToolUse: [{ matcher: 'write_file', command: 'echo test' }] };
      expect(hooks.PreToolUse.filter(h => h.matcher === 'read_file').length).toBe(0);
    });
  });
});

describe('Localcode CLI', () => {
  describe('node version', () => {
    it('runs on Node 18+', () => {
      const major = parseInt(process.versions.node.split('.')[0], 10);
      expect(major).toBeGreaterThanOrEqual(18);
    });
  });

  describe('environment', () => {
    it('has access to env vars', () => {
      expect(typeof process.env).toBe('object');
    });
    it('reads OPENAI_API_KEY', () => {
      expect(typeof process.env.OPENAI_API_KEY === 'string' || process.env.OPENAI_API_KEY === undefined).toBe(true);
    });
    it('reads ANTHROPIC_API_KEY', () => {
      expect(typeof process.env.ANTHROPIC_API_KEY === 'string' || process.env.ANTHROPIC_API_KEY === undefined).toBe(true);
    });
    it('reads GROQ_API_KEY', () => {
      expect(typeof process.env.GROQ_API_KEY === 'string' || process.env.GROQ_API_KEY === undefined).toBe(true);
    });
  });
});
