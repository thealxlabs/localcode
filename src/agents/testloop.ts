import { logger } from '../core/logger.js';
// src/agents/testloop.ts
// Fix-until-green loop: detect test runner, run tests, feed failures to agent, repeat.

import { execFile } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

export interface TestLoopIteration {
  iteration: number;
  passed: boolean;
  output: string;
  durationMs: number;
}

export interface TestLoopResult {
  passed: boolean;
  iterations: number;
  history: TestLoopIteration[];
}

export interface TestLoopOptions {
  cwd: string;
  maxIterations: number;
  onIteration: (iter: TestLoopIteration) => void;
}

/** Auto-detect the test command for the project. Returns null if unknown. */
export async function detectTestCommand(cwd: string): Promise<string | null> {
  const pkg = path.join(cwd, 'package.json');
  if (fs.existsSync(pkg)) {
    try {
      const p = JSON.parse(fs.readFileSync(pkg, 'utf8')) as { scripts?: Record<string, string>; devDependencies?: Record<string, string>; dependencies?: Record<string, string> };
      if (p.scripts?.test && !p.scripts.test.includes('no test')) return 'npm test';
      const deps = { ...p.devDependencies, ...p.dependencies };
      if (deps?.vitest) return 'npx vitest run';
      if (deps?.jest) return 'npx jest';
    } catch (err) { logger.debug('Test detection failed', { error: err instanceof Error ? err.message : String(err) }); }
    return 'npm test';
  }
  if (fs.existsSync(path.join(cwd, 'pytest.ini')) || fs.existsSync(path.join(cwd, 'pyproject.toml'))) {
    return 'python -m pytest';
  }
  if (fs.existsSync(path.join(cwd, 'Cargo.toml'))) return 'cargo test';
  if (fs.existsSync(path.join(cwd, 'go.mod'))) return 'go test ./...';
  return null;
}

/** Run a single test command, return pass/fail + output. */
export function runTests(cmd: string, cwd: string): Promise<{ passed: boolean; output: string }> {
  return new Promise((resolve) => {
    execFile('sh', ['-c', cmd], { cwd, timeout: 120_000 }, (err, stdout, stderr) => {
      const output = [stdout, stderr].filter(Boolean).join('\n').trim();
      resolve({ passed: !err, output: output || '(no output)' });
    });
  });
}

/**
 * Run the fix-until-green loop.
 * @param cmd       — test command to run
 * @param opts      — loop options
 * @param fixFn     — async function that receives failure output and applies fixes
 */
export async function runTestLoop(
  cmd: string,
  opts: TestLoopOptions,
  fixFn: (failureOutput: string, iteration: number) => Promise<void>,
): Promise<TestLoopResult> {
  const history: TestLoopIteration[] = [];

  for (let i = 1; i <= opts.maxIterations; i++) {
    const start = Date.now();
    const { passed, output } = await runTests(cmd, opts.cwd);
    const iter: TestLoopIteration = { iteration: i, passed, output, durationMs: Date.now() - start };
    history.push(iter);
    opts.onIteration(iter);

    if (passed) {
      return { passed: true, iterations: i, history };
    }

    if (i < opts.maxIterations) {
      await fixFn(output, i);
    }
  }

  return { passed: false, iterations: opts.maxIterations, history };
}
