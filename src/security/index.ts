// src/security/index.ts
// Whitelist-based command security classification

import { logger } from '../core/logger.js';

// Whitelist of allowed command prefixes
const ALLOWED_COMMANDS = new Set([
  // Version control
  'git',
  // Package managers
  'npm', 'npx', 'yarn', 'pnpm', 'bun',
  // Languages/runtimes
  'node', 'python', 'python3', 'ruby', 'go', 'rustc', 'cargo',
  // File operations
  'ls', 'cat', 'head', 'tail', 'wc', 'find', 'tree', 'pwd', 'basename', 'dirname', 'file', 'stat', 'echo',
  // Text processing
  'grep', 'sed', 'awk', 'sort', 'uniq', 'cut', 'tr', 'diff', 'comm', 'patch',
  // Archive
  'tar', 'zip', 'unzip', 'gzip', 'gunzip',
  // System info
  'whoami', 'date', 'uname', 'hostname', 'uptime', 'df', 'du', 'free', 'top', 'ps',
  // Build tools
  'make', 'cmake', 'gcc', 'g++', 'clang', 'clang++',
  // Testing
  'jest', 'mocha', 'vitest', 'pytest', 'go', 'cargo',
  // Linting/formatting
  'eslint', 'prettier', 'flake8', 'black', 'gofmt',
  // Misc dev tools
  'curl', 'wget', 'ssh', 'scp', 'rsync', 'docker', 'docker-compose',
  // Safe chmod (non-recursive, non-777)
  'chmod', 'chown',
  // Directory operations
  'mkdir', 'touch', 'cp', 'mv', 'rm',
  // Network
  'ping', 'dig', 'nslookup', 'netstat', 'ss',
  // Documentation
  'man', 'info', 'help',
]);

// Commands that are always blocked regardless of context
const BLOCKED_COMMANDS = new Set([
  'rm -rf /', 'rm -rf /*', 'rm -rf ~', 'rm -rf $HOME',
  'mkfs', 'mkfs.', 'dd if=', 'dd of=',
  '> /dev/sda', '> /dev/disk',
  'shutdown', 'reboot', 'halt', 'poweroff', 'init 0', 'init 6',
  'systemctl poweroff', 'systemctl reboot',
  'chmod -R 777 /', 'chmod -R 777 /*', 'chmod -R 777 ~', 'chmod -R 777 $HOME',
  ':(){:|:&};:', 'forkbomb',
  'kill -9 1', 'kill -9 -1',
  'curl * | sh', 'curl *|sh', 'curl * | bash', 'curl *|bash',
  'wget * | sh', 'wget *|sh', 'wget * | bash', 'wget *|bash',
]);

// Suspicious patterns that require extra scrutiny
const SUSPICIOUS_PATTERNS = [
  /eval\s*\(/,
  /exec\s*\(/,
  /system\s*\(/,
  /`[^`]*`/,
  /\$\([^)]*\)/,
  /\/etc\/(passwd|shadow|hosts|sudoers)/,
  /\.ssh\//,
  /\.env/,
  /AWS_SECRET/,
  /PRIVATE_KEY/,
  /password/i,
  /secret/i,
  /token/i,
];

export interface CommandClassification {
  allowed: boolean;
  reason: string;
  severity: 'safe' | 'review' | 'blocked';
  command: string;
  baseCommand: string;
}

/**
 * Extract the base command from a command string.
 * Handles pipes, redirects, and subshells.
 */
function extractBaseCommand(command: string): string {
  // Get the first command before any pipe or redirect
  const base = command.split(/[\|;&]/)[0].trim();
  // Get the first word (the actual command)
  const parts = base.split(/\s+/);
  return parts[0] || '';
}

/**
 * Classify a command using whitelist-based approach.
 */
export function classifyCommand(command: string): CommandClassification {
  const normalizedCommand = command.toLowerCase().replace(/\s+/g, ' ').trim();
  const baseCommand = extractBaseCommand(command);

  // Check blocked commands first (highest priority)
  for (const blocked of BLOCKED_COMMANDS) {
    const normalizedBlocked = blocked.toLowerCase().replace(/\s+/g, ' ');
    if (normalizedBlocked.includes('*')) {
      const pattern = normalizedBlocked.replace(/\*/g, '.*');
      if (new RegExp(pattern).test(normalizedCommand)) {
        return {
          allowed: false,
          reason: `Command matches blocked pattern: "${blocked}"`,
          severity: 'blocked',
          command,
          baseCommand,
        };
      }
    } else if (normalizedCommand.includes(normalizedBlocked)) {
      return {
        allowed: false,
        reason: `Command contains blocked pattern: "${blocked}"`,
        severity: 'blocked',
        command,
        baseCommand,
      };
    }
  }

  // Check suspicious patterns
  for (const pattern of SUSPICIOUS_PATTERNS) {
    if (pattern.test(command)) {
      return {
        allowed: false,
        reason: `Command contains suspicious pattern: ${pattern.source}`,
        severity: 'blocked',
        command,
        baseCommand,
      };
    }
  }

  // Check whitelist
  if (ALLOWED_COMMANDS.has(baseCommand)) {
    return {
      allowed: true,
      reason: `Command "${baseCommand}" is in the allowed list`,
      severity: 'safe',
      command,
      baseCommand,
    };
  }

  // Not in whitelist - requires review
  return {
    allowed: false,
    reason: `Command "${baseCommand}" is not in the allowed list. Requires explicit approval.`,
    severity: 'review',
    command,
    baseCommand,
  };
}

/**
 * Get a human-readable classification summary.
 */
export function getCommandClassification(command: string): string {
  const classification = classifyCommand(command);
  const icon = classification.severity === 'safe' ? '✓' : classification.severity === 'blocked' ? '✗' : '?';
  return `${icon} ${classification.reason}`;
}

/**
 * Check if a command is allowed without requiring user approval.
 */
export function isCommandAllowed(command: string): boolean {
  return classifyCommand(command).allowed;
}

/**
 * Get the list of allowed commands (for display in help/settings).
 */
export function getAllowedCommands(): string[] {
  return [...ALLOWED_COMMANDS].sort();
}

/**
 * Get the list of blocked patterns (for display in help/settings).
 */
export function getBlockedPatterns(): string[] {
  return [...BLOCKED_COMMANDS].sort();
}
