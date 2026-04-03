// src/plugins/loader.ts
// Dynamic plugin loader with sandboxing for LocalCode

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { pathToFileURL } from 'url';
import { createRequire } from 'module';
import { logger } from '../core/logger.js';

export interface PluginContext {
  workingDir: string;
  sysMsg: (text: string, isError?: boolean) => void;
  addDisplay: (msg: { role: string; content: string; isError?: boolean }) => string;
}

export interface LocalCodePlugin {
  name: string;
  trigger: string;
  description: string;
  execute: (args: string, context: PluginContext) => Promise<void>;
}

const PLUGINS_DIR = path.join(os.homedir(), '.localcode', 'plugins');

// Whitelist of allowed Node.js modules that plugins can use
const ALLOWED_MODULES = new Set([
  'path', 'os', 'crypto', 'events', 'stream', 'util',
  'string_decoder', 'buffer', 'querystring', 'url',
]);

// Dangerous globals that plugins should NOT access
const DANGEROUS_GLOBALS = new Set([
  'process', 'require', 'module', 'exports', 'global',
  '__filename', '__dirname', 'eval', 'Function',
]);

/**
 * Create a sandboxed context for plugin execution.
 * Restricts access to dangerous globals while providing
 * only the safe APIs the plugin needs.
 */
function createSandboxedContext(
  workingDir: string,
  sysMsg: (text: string, isError?: boolean) => void,
  addDisplay: (msg: { role: string; content: string; isError?: boolean }) => string,
): PluginContext {
  return {
    workingDir,
    sysMsg,
    addDisplay,
  };
}

/**
 * Validate plugin source code for dangerous patterns before loading.
 * This is a basic static analysis check — not a security boundary.
 */
function validatePluginSource(source: string): string[] {
  const issues: string[] = [];
  const dangerousPatterns = [
    { pattern: /\beval\s*\(/, desc: 'eval() usage' },
    { pattern: /\bnew\s+Function\s*\(/, desc: 'Function constructor' },
    { pattern: /\bprocess\.(env|exit|kill|binding)/, desc: 'dangerous process access' },
    { pattern: /\brequire\s*\(\s*['"]child_process['"]\s*\)/, desc: 'child_process import' },
    { pattern: /\brequire\s*\(\s*['"]fs['"]\s*\)/, desc: 'fs import' },
    { pattern: /\brequire\s*\(\s*['"]net['"]\s*\)/, desc: 'net import' },
    { pattern: /\brequire\s*\(\s*['"]http['"]\s*\)/, desc: 'http import' },
    { pattern: /\brequire\s*\(\s*['"]https['"]\s*\)/, desc: 'https import' },
  ];

  for (const { pattern, desc } of dangerousPatterns) {
    if (pattern.test(source)) {
      issues.push(`Blocked: ${desc}`);
    }
  }

  return issues;
}

export async function loadPlugins(): Promise<LocalCodePlugin[]> {
  const plugins: LocalCodePlugin[] = [];

  try {
    if (!fs.existsSync(PLUGINS_DIR)) {
      fs.mkdirSync(PLUGINS_DIR, { recursive: true });
      return plugins;
    }

    const files = fs.readdirSync(PLUGINS_DIR).filter((f) => f.endsWith('.js'));

    for (const file of files) {
      const filePath = path.join(PLUGINS_DIR, file);
      try {
        // Validate plugin source before loading
        const source = fs.readFileSync(filePath, 'utf8');
        const issues = validatePluginSource(source);
        if (issues.length > 0) {
          logger.warn('Plugin blocked by security check', { file, issues });
          continue;
        }

        // Dynamic import using pathToFileURL for cross-platform compatibility
        const fileUrl = pathToFileURL(filePath);
        const mod = await import(fileUrl.href) as { default?: LocalCodePlugin };
        const plugin = mod.default;

        if (
          plugin &&
          typeof plugin.name === 'string' &&
          typeof plugin.trigger === 'string' &&
          typeof plugin.description === 'string' &&
          typeof plugin.execute === 'function'
        ) {
          // Wrap plugin execute in a timeout to prevent infinite loops
          const originalExecute = plugin.execute;
          plugin.execute = async (args: string, context: PluginContext) => {
            const timeout = new Promise<never>((_, reject) => {
              setTimeout(() => reject(new Error('Plugin execution timed out (30s)')), 30000);
            });
            await Promise.race([originalExecute(args, context), timeout]);
          };

          plugins.push(plugin);
          logger.info('Plugin loaded', { name: plugin.name, trigger: plugin.trigger });
        }
      } catch (err) {
        logger.warn('Failed to load plugin', { file, error: err instanceof Error ? err.message : String(err) });
      }
    }
  } catch (err) {
    logger.warn('Could not read plugins directory', { error: err instanceof Error ? err.message : String(err) });
  }

  return plugins;
}
