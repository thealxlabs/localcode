// src/plugins/loader.ts
// Dynamic plugin loader for LocalCode

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export interface PluginContext {
  workingDir: string;
  sysMsg: (text: string, isError?: boolean) => void;
  addDisplay: (msg: { role: string; content: string; isError?: boolean }) => string;
}

export interface LocalCodePlugin {
  name: string;
  trigger: string;       // e.g. '/myplugin'
  description: string;
  execute: (args: string, context: PluginContext) => Promise<void>;
}

const PLUGINS_DIR = path.join(os.homedir(), '.localcode', 'plugins');

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
        // Dynamic import using file URL for ESM compatibility
        const fileUrl = new URL(`file://${filePath}`);
        const mod = await import(fileUrl.href) as { default?: LocalCodePlugin };
        const plugin = mod.default;

        if (
          plugin &&
          typeof plugin.name === 'string' &&
          typeof plugin.trigger === 'string' &&
          typeof plugin.description === 'string' &&
          typeof plugin.execute === 'function'
        ) {
          plugins.push(plugin);
        }
      } catch {
        // Skip invalid plugins silently
      }
    }
  } catch {
    // If we can't read plugins dir, just return empty
  }

  return plugins;
}
