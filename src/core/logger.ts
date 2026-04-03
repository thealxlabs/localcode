// src/core/logger.ts
// Structured logging framework with automatic rotation

import { writeFileSync, appendFileSync, existsSync, mkdirSync, readdirSync, statSync, unlinkSync, readFileSync, createReadStream, createWriteStream } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { createGzip } from 'zlib';
import { pipeline } from 'stream';
import { promisify } from 'util';

const pipelineAsync = promisify(pipeline);

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LoggerConfig {
  maxFileSize: number;      // bytes before rotation (default: 10MB)
  maxFiles: number;         // max log files to keep (default: 5)
  compress: boolean;        // compress rotated logs with gzip
}

const LOG_DIR = join(homedir(), '.localcode', 'logs');
const LOG_FILE = join(LOG_DIR, `localcode-${new Date().toISOString().slice(0, 10)}.log`);

const DEFAULT_CONFIG: LoggerConfig = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  maxFiles: 5,
  compress: true,
};

let currentLevel: LogLevel = 'info';
let config: LoggerConfig = { ...DEFAULT_CONFIG };
let rotationInProgress = false;

export function setLogLevel(level: LogLevel) {
  currentLevel = level;
}

export function setLoggerConfig(cfg: Partial<LoggerConfig>) {
  config = { ...config, ...cfg };
}

const LEVEL_PRIORITY: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3 };

function shouldLog(level: LogLevel): boolean {
  return LEVEL_PRIORITY[level] >= LEVEL_PRIORITY[currentLevel];
}

function formatLog(level: LogLevel, message: string, context?: Record<string, unknown>): string {
  const entry = {
    ts: new Date().toISOString(),
    level,
    msg: message,
    ...(context || {}),
  };
  return JSON.stringify(entry);
}

/**
 * Rotate log files when size limit is reached.
 * Oldest files are deleted or compressed based on config.
 */
async function rotateLogs(): Promise<void> {
  if (rotationInProgress) return;
  rotationInProgress = true;

  try {
    if (!existsSync(LOG_DIR)) return;

    // Get current file size
    if (!existsSync(LOG_FILE)) {
      rotationInProgress = false;
      return;
    }

    const stats = statSync(LOG_FILE);
    if (stats.size < config.maxFileSize) {
      rotationInProgress = false;
      return;
    }

    // Rotate: rename current file with timestamp suffix
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const rotatedFile = LOG_FILE.replace('.log', `-${timestamp}.log`);
    writeFileSync(rotatedFile, '', 'utf8'); // Create empty file
    const content = readFileSync(LOG_FILE, 'utf8');
    appendFileSync(rotatedFile, content, 'utf8');
    writeFileSync(LOG_FILE, '', 'utf8'); // Truncate current file

    // Compress if enabled
    if (config.compress) {
      try {
        const gzFile = rotatedFile + '.gz';
        await pipelineAsync(
          createReadStream(rotatedFile),
          createGzip(),
          createWriteStream(gzFile),
        );
        unlinkSync(rotatedFile); // Remove uncompressed version
      } catch {
        // If compression fails, keep uncompressed file
      }
    }

    // Clean up old files
    cleanupOldLogs();

  } catch (err) {
    // If rotation fails, continue logging to current file
    // Don't crash the app over log rotation
  } finally {
    rotationInProgress = false;
  }
}

function cleanupOldLogs(): void {
  try {
    if (!existsSync(LOG_DIR)) return;

    const files = readdirSync(LOG_DIR)
      .filter(f => f.startsWith('localcode-') && (f.endsWith('.log') || f.endsWith('.log.gz')))
      .map(f => ({
        name: f,
        path: join(LOG_DIR, f),
        mtime: statSync(join(LOG_DIR, f)).mtime.getTime(),
      }))
      .sort((a, b) => b.mtime - a.mtime); // Newest first

    // Delete oldest files beyond maxFiles limit
    for (let i = config.maxFiles; i < files.length; i++) {
      try {
        unlinkSync(files[i].path);
      } catch {
        // Skip files that can't be deleted
      }
    }
  } catch {
    // If cleanup fails, continue without cleaning
  }
}

function writeLog(level: LogLevel, message: string, context?: Record<string, unknown>) {
  if (!shouldLog(level)) return;
  try {
    if (!existsSync(LOG_DIR)) mkdirSync(LOG_DIR, { recursive: true });
    appendFileSync(LOG_FILE, formatLog(level, message, context) + '\n');

    // Check if rotation needed (non-blocking)
    rotateLogs().catch(() => {
      // Ignore rotation errors
    });
  } catch {
    // If logging fails, silently skip — don't crash the app
  }
}

export const logger = {
  debug: (message: string, context?: Record<string, unknown>) => {
    writeLog('debug', message, context);
  },
  info: (message: string, context?: Record<string, unknown>) => {
    writeLog('info', message, context);
  },
  warn: (message: string, context?: Record<string, unknown>) => {
    writeLog('warn', message, context);
  },
  error: (message: string, context?: Record<string, unknown>) => {
    writeLog('error', message, context);
  },
};
