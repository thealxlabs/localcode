// src/settings/migrations.ts
// Settings migration system for version upgrades

import { logger } from '../core/logger.js';
import type { Settings } from './types.js';

const CURRENT_SCHEMA_VERSION = 2;

interface Migration {
  fromVersion: number;
  toVersion: number;
  migrate: (settings: Record<string, unknown>) => Record<string, unknown>;
}

const migrations: Migration[] = [
  {
    fromVersion: 1,
    toVersion: 2,
    migrate: (settings) => {
      // v1 -> v2: Rename 'nyx.md' references to 'localcode.md'
      const s = { ...settings };
      if (s.memory && typeof s.memory === 'object') {
        const mem = s.memory as Record<string, unknown>;
        if (mem.memoryFile === '.nyx.md') {
          mem.memoryFile = '.localcode.md';
        }
      }
      // v1 -> v2: Ensure agentDispatch section exists
      if (!s.agentDispatch) {
        s.agentDispatch = {
          enabled: true,
          requireApproval: false,
          maxConcurrentAgents: 5,
          budgetLimit: 10,
          preferredModel: 'qwen2.5-coder:7b',
          fallbackModel: 'qwen2.5-coder:3b',
          dispatchStrategy: 'smart',
          qualityGate: true,
          maxRetries: 3,
        };
      }
      return s;
    },
  },
];

export function migrateSettings(raw: Record<string, unknown>): Settings {
  const version = (raw.version as number) ?? 1;
  if (version >= CURRENT_SCHEMA_VERSION) {
    return raw as unknown as Settings;
  }

  logger.info('Migrating settings', { fromVersion: version, toVersion: CURRENT_SCHEMA_VERSION });

  let current = { ...raw };
  for (const migration of migrations) {
    if (version < migration.fromVersion) continue;
    if (migration.fromVersion >= migration.toVersion) continue;
    current = migration.migrate(current);
    logger.info('Applied migration', { from: migration.fromVersion, to: migration.toVersion });
  }

  (current as Record<string, unknown>).version = CURRENT_SCHEMA_VERSION;
  return current as unknown as Settings;
}
