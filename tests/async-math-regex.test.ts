import { describe, it, expect } from 'vitest';

describe('Async Utilities', () => {
  describe('Promise', () => {
    it('should resolve', async () => {
      expect(await Promise.resolve(42)).toBe(42);
    });
    it('should reject', async () => {
      await expect(Promise.reject(new Error('x'))).rejects.toThrow('x');
    });
    it('should handle all', async () => {
      const results = await Promise.all([Promise.resolve(1), Promise.resolve(2)]);
      expect(results).toEqual([1, 2]);
    });
    it('should handle allSettled', async () => {
      const results = await Promise.allSettled([Promise.resolve(1), Promise.reject(new Error('x'))]);
      expect(results.length).toBe(2);
      expect(results[0].status).toBe('fulfilled');
      expect(results[1].status).toBe('rejected');
    });
    it('should handle race', async () => {
      const result = await Promise.race([Promise.resolve('fast'), new Promise(r => setTimeout(() => r('slow'), 1000))]);
      expect(result).toBe('fast');
    });
    it('should handle any', async () => {
      const result = await Promise.any([Promise.reject(new Error('x')), Promise.resolve('ok')]);
      expect(result).toBe('ok');
    });
    it('should handle withResolvers', () => {
      const { promise, resolve } = Promise.withResolvers<string>();
      resolve('done');
      expect(promise).resolves.toBe('done');
    });
  });

  describe('setTimeout', () => {
    it('should delay execution', async () => {
      const start = Date.now();
      await new Promise(r => setTimeout(r, 50));
      expect(Date.now() - start).toBeGreaterThanOrEqual(50);
    });
    it('should clear timeout', async () => {
      let called = false;
      const t = setTimeout(() => { called = true; }, 1000);
      clearTimeout(t);
      await new Promise(r => setTimeout(r, 50));
      expect(called).toBe(false);
    });
  });

  describe('async iteration', () => {
    it('should iterate with for-await', async () => {
      async function* gen() { yield 1; yield 2; yield 3; }
      const results: number[] = [];
      for await (const v of gen()) results.push(v);
      expect(results).toEqual([1, 2, 3]);
    });
  });

  describe('concurrency', () => {
    it('should run tasks in parallel', async () => {
      const start = Date.now();
      await Promise.all([
        new Promise(r => setTimeout(r, 50)),
        new Promise(r => setTimeout(r, 50)),
        new Promise(r => setTimeout(r, 50)),
      ]);
      expect(Date.now() - start).toBeLessThan(150);
    });
    it('should run tasks sequentially', async () => {
      const start = Date.now();
      for (let i = 0; i < 3; i++) {
        await new Promise(r => setTimeout(r, 20));
      }
      expect(Date.now() - start).toBeGreaterThanOrEqual(60);
    });
    it('should limit concurrency', async () => {
      let concurrent = 0;
      let maxConcurrent = 0;
      const tasks = Array.from({ length: 10 }, async () => {
        concurrent++;
        maxConcurrent = Math.max(maxConcurrent, concurrent);
        await new Promise(r => setTimeout(r, 10));
        concurrent--;
      });
      // Run in batches of 3
      for (let i = 0; i < tasks.length; i += 3) {
        await Promise.all(tasks.slice(i, i + 3));
      }
      expect(maxConcurrent).toBeLessThanOrEqual(3);
    });
  });
});

describe('Math Utilities', () => {
  describe('basic operations', () => {
    it('should add', () => { expect(1 + 2).toBe(3); });
    it('should subtract', () => { expect(5 - 3).toBe(2); });
    it('should multiply', () => { expect(3 * 4).toBe(12); });
    it('should divide', () => { expect(10 / 2).toBe(5); });
    it('should modulo', () => { expect(10 % 3).toBe(1); });
    it('should power', () => { expect(2 ** 10).toBe(1024); });
    it('should floor', () => { expect(Math.floor(3.7)).toBe(3); });
    it('should ceil', () => { expect(Math.ceil(3.2)).toBe(4); });
    it('should round', () => { expect(Math.round(3.5)).toBe(4); });
    it('should abs', () => { expect(Math.abs(-5)).toBe(5); });
    it('should min', () => { expect(Math.min(3, 1, 4)).toBe(1); });
    it('should max', () => { expect(Math.max(3, 1, 4)).toBe(4); });
    it('should sqrt', () => { expect(Math.sqrt(16)).toBe(4); });
    it('should pow', () => { expect(Math.pow(2, 8)).toBe(256); });
    it('should random', () => {
      const r = Math.random();
      expect(r).toBeGreaterThanOrEqual(0);
      expect(r).toBeLessThan(1);
    });
  });

  describe('clamping', () => {
    it('should clamp below min', () => { expect(Math.max(0, Math.min(100, -5))).toBe(0); });
    it('should clamp above max', () => { expect(Math.max(0, Math.min(100, 150))).toBe(100); });
    it('should pass through range', () => { expect(Math.max(0, Math.min(100, 50))).toBe(50); });
  });

  describe('lerping', () => {
    it('should lerp from 0 to 100 at 0.5', () => {
      const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
      expect(lerp(0, 100, 0.5)).toBe(50);
    });
    it('should lerp at 0', () => {
      const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
      expect(lerp(0, 100, 0)).toBe(0);
    });
    it('should lerp at 1', () => {
      const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
      expect(lerp(0, 100, 1)).toBe(100);
    });
  });

  describe('percentage', () => {
    it('should calculate percentage', () => { expect((25 / 100) * 100).toBe(25); });
    it('should calculate increase', () => { expect(((150 - 100) / 100) * 100).toBe(50); });
    it('should calculate decrease', () => { expect(((50 - 100) / 100) * 100).toBe(-50); });
  });
});

describe('Regex Utilities', () => {
  describe('matching', () => {
    it('should match simple pattern', () => {
      expect('hello world'.match(/world/)).not.toBeNull();
    });
    it('should match with groups', () => {
      const m = 'hello world'.match(/(\w+) (\w+)/);
      expect(m).not.toBeNull();
      expect(m![1]).toBe('hello');
    });
    it('should match globally', () => {
      const matches = 'a,b,a,c,a'.match(/a/g);
      expect(matches).not.toBeNull();
      expect(matches!.length).toBe(3);
    });
    it('should match case insensitive', () => {
      expect('HELLO'.match(/hello/i)).not.toBeNull();
    });
    it('should not match', () => {
      expect('hello'.match(/xyz/)).toBeNull();
    });
    it('should test pattern', () => {
      expect(/hello/.test('hello world')).toBe(true);
    });
  });

  describe('replacement', () => {
    it('should replace first', () => {
      expect('aaa'.replace('a', 'b')).toBe('baa');
    });
    it('should replace all with regex', () => {
      expect('aaa'.replace(/a/g, 'b')).toBe('bbb');
    });
    it('should replace with function', () => {
      expect('123'.replace(/\d/g, d => String(parseInt(d) * 2))).toBe('246');
    });
  });

  describe('splitting', () => {
    it('should split by pattern', () => {
      expect('a,b;c.d'.split(/[,;.]/)).toEqual(['a', 'b', 'c', 'd']);
    });
    it('should split with limit', () => {
      expect('a,b,c,d'.split(',', 2)).toEqual(['a', 'b']);
    });
  });

  describe('validation patterns', () => {
    it('should validate email format', () => {
      const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      expect(emailRe.test('user@example.com')).toBe(true);
      expect(emailRe.test('invalid')).toBe(false);
    });
    it('should validate URL format', () => {
      const urlRe = /^https?:\/\/.+/;
      expect(urlRe.test('https://example.com')).toBe(true);
      expect(urlRe.test('not-a-url')).toBe(false);
    });
    it('should validate hex color', () => {
      const hexRe = /^#[0-9a-f]{6}$/i;
      expect(hexRe.test('#ff0000')).toBe(true);
      expect(hexRe.test('not-hex')).toBe(false);
    });
    it('should validate semver', () => {
      const semverRe = /^\d+\.\d+\.\d+$/;
      expect(semverRe.test('1.2.3')).toBe(true);
      expect(semverRe.test('1.2')).toBe(false);
    });
  });
});

describe('Object Utilities', () => {
  describe('property access', () => {
    it('should check property existence', () => {
      expect('key' in { key: 'value' }).toBe(true);
    });
    it('should get keys', () => {
      expect(Object.keys({ a: 1, b: 2 })).toEqual(['a', 'b']);
    });
    it('should get values', () => {
      expect(Object.values({ a: 1, b: 2 })).toEqual([1, 2]);
    });
    it('should get entries', () => {
      expect(Object.entries({ a: 1 })).toEqual([['a', 1]]);
    });
    it('should freeze', () => {
      const obj = Object.freeze({ a: 1 });
      expect(Object.isFrozen(obj)).toBe(true);
    });
    it('should seal', () => {
      const obj = Object.seal({ a: 1 });
      expect(Object.isSealed(obj)).toBe(true);
    });
  });

  describe('merging', () => {
    it('should spread objects', () => {
      expect({ ...{ a: 1 }, ...{ b: 2 } }).toEqual({ a: 1, b: 2 });
    });
    it('should override properties', () => {
      expect({ ...{ a: 1 }, ...{ a: 2 } }).toEqual({ a: 2 });
    });
    it('should assign', () => {
      const target = { a: 1 };
      Object.assign(target, { b: 2 });
      expect(target).toEqual({ a: 1, b: 2 });
    });
    it('should deep clone', () => {
      const original = { a: { b: 1 } };
      const clone = JSON.parse(JSON.stringify(original));
      clone.a.b = 2;
      expect(original.a.b).toBe(1);
    });
  });

  describe('transformation', () => {
    it('should map entries to object', () => {
      const obj = Object.fromEntries([['a', 1], ['b', 2]]);
      expect(obj).toEqual({ a: 1, b: 2 });
    });
    it('should filter entries', () => {
      const obj = { a: 1, b: 2, c: 3 };
      const filtered = Object.fromEntries(Object.entries(obj).filter(([_, v]) => v > 1));
      expect(filtered).toEqual({ b: 2, c: 3 });
    });
    it('should transform values', () => {
      const obj = { a: 1, b: 2 };
      const transformed = Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, v * 2]));
      expect(transformed).toEqual({ a: 2, b: 4 });
    });
  });

  describe('edge cases', () => {
    it('should handle null', () => {
      expect(Object.keys(null as any)).toThrow();
    });
    it('should handle undefined', () => {
      expect(Object.keys(undefined as any)).toThrow();
    });
    it('should handle empty object', () => {
      expect(Object.keys({})).toEqual([]);
    });
    it('should handle symbols', () => {
      const sym = Symbol('test');
      const obj = { [sym]: 'value' };
      expect(Object.getOwnPropertySymbols(obj)).toContain(sym);
    });
  });
});

describe('Environment Utilities', () => {
  describe('env access', () => {
    it('should read env vars', () => {
      expect(typeof process.env).toBe('object');
    });
    it('should handle missing env', () => {
      expect(process.env.NONEXISTENT_VAR_12345).toBeUndefined();
    });
    it('should set env vars', () => {
      process.env.TEST_VAR = 'test';
      expect(process.env.TEST_VAR).toBe('test');
      delete process.env.TEST_VAR;
    });
  });

  describe('platform detection', () => {
    it('should detect platform', () => {
      expect(['darwin', 'linux', 'win32']).toContain(process.platform);
    });
    it('should detect architecture', () => {
      expect(['arm64', 'x64']).toContain(process.arch);
    });
    it('should get node version', () => {
      expect(process.versions.node).toMatch(/\d+\.\d+/);
    });
  });

  describe('path utilities', () => {
    it('should get home directory', () => {
      const { homedir } = require('os');
      expect(homedir().length).toBeGreaterThan(0);
    });
    it('should get tmp directory', () => {
      const { tmpdir } = require('os');
      expect(tmpdir().length).toBeGreaterThan(0);
    });
    it('should get hostname', () => {
      const { hostname } = require('os');
      expect(hostname().length).toBeGreaterThan(0);
    });
    it('should get CPU count', () => {
      const { cpus } = require('os');
      expect(cpus().length).toBeGreaterThan(0);
    });
    it('should get total memory', () => {
      const { totalmem } = require('os');
      expect(totalmem()).toBeGreaterThan(0);
    });
    it('should get free memory', () => {
      const { freemem } = require('os');
      expect(freemem()).toBeGreaterThan(0);
    });
    it('should get uptime', () => {
      const { uptime } = require('os');
      expect(uptime()).toBeGreaterThan(0);
    });
  });
});
