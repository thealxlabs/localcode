// src/settings/manager.ts

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { homedir } from 'os';
import type { Settings } from './types.js';
import { DEFAULT_SETTINGS } from './types.js';

const GLOBAL_CONFIG_DIR = join(homedir(), '.localcode');
const GLOBAL_SETTINGS_PATH = join(GLOBAL_CONFIG_DIR, 'settings.json');
const PROJECT_SETTINGS_PATHS = ['.localcode/settings.json', 'localcode.json', '.localcoderc'];

function deepMerge(target: Record<string, unknown>, source: Record<string, unknown>): Record<string, unknown> {
  const result = { ...target };
  for (const key of Object.keys(source)) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key]) && target[key] && typeof target[key] === 'object') {
      result[key] = deepMerge(target[key] as Record<string, unknown>, source[key] as Record<string, unknown>);
    } else {
      result[key] = source[key];
    }
  }
  return result;
}

export function loadSettings(): Settings {
  let settings = { ...DEFAULT_SETTINGS };

  // Load global settings
  if (existsSync(GLOBAL_SETTINGS_PATH)) {
    try {
      const globalSettings = JSON.parse(readFileSync(GLOBAL_SETTINGS_PATH, 'utf-8'));
      settings = deepMerge(settings, globalSettings) as Settings;
    } catch {
      // Use defaults if file is corrupt
    }
  }

  // Load project settings (first found wins)
  for (const relPath of PROJECT_SETTINGS_PATHS) {
    const fullPath = join(process.cwd(), relPath);
    if (existsSync(fullPath)) {
      try {
        const projectSettings = JSON.parse(readFileSync(fullPath, 'utf-8'));
        settings = deepMerge(settings, projectSettings) as Settings;
        break;
      } catch {
        // Skip corrupt project settings
      }
    }
  }

  return settings;
}

export function saveSettings(settings: Settings, scope: 'global' | 'project' = 'global'): boolean {
  try {
    let path: string;
    if (scope === 'global') {
      if (!existsSync(GLOBAL_CONFIG_DIR)) mkdirSync(GLOBAL_CONFIG_DIR, { recursive: true });
      path = GLOBAL_SETTINGS_PATH;
    } else {
      const dir = join(process.cwd(), '.localcode');
      if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
      path = join(dir, 'settings.json');
    }

    writeFileSync(path, JSON.stringify(settings, null, 2), 'utf-8');
    return true;
  } catch {
    return false;
  }
}

export function getSetting<T>(path: string, defaultValue?: T): T {
  const settings = loadSettings();
  const parts = path.split('.');
  let current: unknown = settings;
  for (const part of parts) {
    if (current && typeof current === 'object' && part in (current as Record<string, unknown>)) {
      current = (current as Record<string, unknown>)[part];
    } else {
      return defaultValue as T;
    }
  }
  return (current ?? defaultValue) as T;
}

export function setSetting(path: string, value: unknown, scope: 'global' | 'project' = 'global'): boolean {
  const settings = loadSettings();
  const parts = path.split('.');
  let current: Record<string, unknown> = settings as unknown as Record<string, unknown>;
  for (let i = 0; i < parts.length - 1; i++) {
    if (!(parts[i] in current)) current[parts[i]] = {};
    current = current[parts[i]] as Record<string, unknown>;
  }
  current[parts[parts.length - 1]] = value;
  return saveSettings(settings, scope);
}

export function resetSettings(scope: 'global' | 'project' = 'global'): boolean {
  return saveSettings(DEFAULT_SETTINGS, scope);
}

export function exportSettings(): string {
  return JSON.stringify(loadSettings(), null, 2);
}

export function importSettings(json: string, scope: 'global' | 'project' = 'global'): boolean {
  try {
    const parsed = JSON.parse(json);
    return saveSettings(parsed as Settings, scope);
  } catch {
    return false;
  }
}

export function getSettingsSummary(): string {
  const s = loadSettings();
  return [
    `Provider: ${s.provider.provider}/${s.provider.model}`,
    `Auto Agent Dispatch: ${s.agentDispatch.enabled ? 'ON' : 'OFF'} (${s.agentDispatch.dispatchStrategy})`,
    `Require Approval: ${s.agentDispatch.requireApproval ? 'YES' : 'NO'}`,
    `Max Concurrent Agents: ${s.agentDispatch.maxConcurrentAgents}`,
    `Budget Limit: $${s.agentDispatch.budgetLimit.toFixed(2)}`,
    `Quality Gates: ${s.agentDispatch.qualityGate ? 'ON' : 'OFF'}`,
    `Permissions: edit=${s.permissions.fileEdit} write=${s.permissions.fileWrite} bash=${s.permissions.bash}`,
    `Theme: ${s.ui.theme.name}`,
    `Auto-Save: ${s.session.autoSave ? `${s.session.autoSaveInterval}s` : 'OFF'}`,
    `Auto-Compact: ${s.session.autoCompact ? `>${s.session.compactThreshold} msgs` : 'OFF'}`,
    `Git: ${s.git.enabled ? (s.git.autoCommit ? 'auto-commit' : 'enabled') : 'disabled'}`,
    `Memory: ${s.memory.enabled ? (s.memory.autoExtract ? 'auto-extract' : 'enabled') : 'disabled'}`,
    `MCP: ${s.mcp.enabled ? `${Object.keys(s.mcp.servers).length} servers` : 'disabled'}`,
  ].join('\n');
}
