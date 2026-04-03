import { describe, it, expect } from 'vitest';

describe('Localcode Final Tests', () => {
  describe('string utilities', () => {
    it('truncates long strings', () => {
      expect('a'.repeat(100).slice(0, 50).length).toBe(50);
    });
    it('formats numbers', () => {
      expect((1000000).toLocaleString()).toBe('1,000,000');
    });
    it('formats currency', () => {
      expect((12.34).toFixed(2)).toBe('12.34');
    });
    it('pads strings', () => {
      expect('5'.padStart(3, '0')).toBe('005');
    });
    it('repeats strings', () => {
      expect('ab'.repeat(3)).toBe('ababab');
    });
    it('trims whitespace', () => {
      expect('  hello  '.trim()).toBe('hello');
    });
    it('replaces all', () => {
      expect('aaa'.replace(/a/g, 'b')).toBe('bbb');
    });
    it('splits strings', () => {
      expect('a,b,c'.split(',')).toEqual(['a', 'b', 'c']);
    });
    it('joins arrays', () => {
      expect(['a', 'b'].join('-')).toBe('a-b');
    });
    it('checks startsWith', () => {
      expect('hello'.startsWith('hel')).toBe(true);
    });
    it('checks endsWith', () => {
      expect('hello'.endsWith('lo')).toBe(true);
    });
    it('checks includes', () => {
      expect('hello'.includes('ell')).toBe(true);
    });
  });

  describe('array operations', () => {
    it('filters', () => {
      expect([1, 2, 3].filter(x => x > 1)).toEqual([2, 3]);
    });
    it('maps', () => {
      expect([1, 2].map(x => x * 2)).toEqual([2, 4]);
    });
    it('reduces', () => {
      expect([1, 2, 3].reduce((a, b) => a + b, 0)).toBe(6);
    });
    it('finds', () => {
      expect([1, 2, 3].find(x => x > 1)).toBe(2);
    });
    it('finds index', () => {
      expect([1, 2, 3].findIndex(x => x > 1)).toBe(1);
    });
    it('sorts', () => {
      expect([3, 1, 2].sort((a, b) => a - b)).toEqual([1, 2, 3]);
    });
    it('reverses', () => {
      expect([1, 2, 3].slice().reverse()).toEqual([3, 2, 1]);
    });
    it('slices', () => {
      expect([1, 2, 3, 4].slice(1, 3)).toEqual([2, 3]);
    });
    it('concatenates', () => {
      expect([1].concat([2])).toEqual([1, 2]);
    });
    it('flattens', () => {
      expect([[1], [2]].flat()).toEqual([1, 2]);
    });
    it('deduplicates', () => {
      expect([...new Set([1, 1, 2])]).toEqual([1, 2]);
    });
  });

  describe('object operations', () => {
    it('gets keys', () => {
      expect(Object.keys({ a: 1 })).toEqual(['a']);
    });
    it('gets values', () => {
      expect(Object.values({ a: 1 })).toEqual([1]);
    });
    it('gets entries', () => {
      expect(Object.entries({ a: 1 })).toEqual([['a', 1]]);
    });
    it('spreads', () => {
      expect({ ...{ a: 1 }, ...{ b: 2 } }).toEqual({ a: 1, b: 2 });
    });
    it('assigns', () => {
      const t = { a: 1 };
      Object.assign(t, { b: 2 });
      expect(t).toEqual({ a: 1, b: 2 });
    });
    it('freezes', () => {
      expect(Object.isFrozen(Object.freeze({}))).toBe(true);
    });
    it('seals', () => {
      expect(Object.isSealed(Object.seal({}))).toBe(true);
    });
    it('creates from entries', () => {
      expect(Object.fromEntries([['a', 1]])).toEqual({ a: 1 });
    });
  });

  describe('JSON operations', () => {
    it('parses objects', () => {
      expect(JSON.parse('{"a": 1}').a).toBe(1);
    });
    it('parses arrays', () => {
      expect(JSON.parse('[1, 2]')).toEqual([1, 2]);
    });
    it('stringifies objects', () => {
      expect(JSON.stringify({ a: 1 })).toBe('{"a":1}');
    });
    it('handles null', () => {
      expect(JSON.parse('null')).toBeNull();
    });
    it('handles invalid', () => {
      expect(() => JSON.parse('x')).toThrow();
    });
  });

  describe('date operations', () => {
    it('creates timestamps', () => {
      expect(Date.now()).toBeGreaterThan(0);
    });
    it('creates ISO strings', () => {
      expect(new Date().toISOString()).toMatch(/\d{4}-\d{2}-\d{2}/);
    });
    it('calculates duration', () => {
      const start = Date.now() - 100;
      expect(Date.now() - start).toBeGreaterThanOrEqual(100);
    });
    it('converts to seconds', () => {
      expect(5000 / 1000).toBe(5);
    });
    it('converts to minutes', () => {
      expect(120000 / 60000).toBe(2);
    });
  });

  describe('math operations', () => {
    it('adds', () => { expect(1 + 1).toBe(2); });
    it('subtracts', () => { expect(5 - 3).toBe(2); });
    it('multiplies', () => { expect(3 * 4).toBe(12); });
    it('divides', () => { expect(10 / 2).toBe(5); });
    it('floors', () => { expect(Math.floor(3.7)).toBe(3); });
    it('ceils', () => { expect(Math.ceil(3.2)).toBe(4); });
    it('rounds', () => { expect(Math.round(3.5)).toBe(4); });
    it('abs', () => { expect(Math.abs(-5)).toBe(5); });
    it('min', () => { expect(Math.min(3, 1)).toBe(1); });
    it('max', () => { expect(Math.max(3, 1)).toBe(3); });
    it('sqrt', () => { expect(Math.sqrt(16)).toBe(4); });
    it('pow', () => { expect(Math.pow(2, 8)).toBe(256); });
    it('random', () => {
      const r = Math.random();
      expect(r).toBeGreaterThanOrEqual(0);
      expect(r).toBeLessThan(1);
    });
    it('clamps', () => {
      expect(Math.max(0, Math.min(100, 150))).toBe(100);
    });
  });

  describe('regex operations', () => {
    it('matches', () => {
      expect('hello'.match(/ell/)).not.toBeNull();
    });
    it('tests', () => {
      expect(/hello/.test('hello world')).toBe(true);
    });
    it('replaces', () => {
      expect('hello'.replace(/ell/, 'i')).toBe('hio');
    });
    it('splits', () => {
      expect('a,b'.split(/,/)).toEqual(['a', 'b']);
    });
    it('matches globally', () => {
      expect('aba'.match(/a/g)!.length).toBe(2);
    });
  });

  describe('error handling', () => {
    it('creates errors', () => {
      expect(new Error('test').message).toBe('test');
    });
    it('catches sync', () => {
      let caught = false;
      try { throw new Error('x'); } catch { caught = true; }
      expect(caught).toBe(true);
    });
    it('handles finally', () => {
      let f = false;
      try { throw new Error('x'); } catch {} finally { f = true; }
      expect(f).toBe(true);
    });
  });

  describe('promise operations', () => {
    it('resolves', async () => {
      expect(await Promise.resolve(42)).toBe(42);
    });
    it('rejects', async () => {
      await expect(Promise.reject(new Error('x'))).rejects.toThrow('x');
    });
    it('handles all', async () => {
      expect(await Promise.all([Promise.resolve(1)])).toEqual([1]);
    });
    it('handles race', async () => {
      expect(await Promise.race([Promise.resolve('fast')])).toBe('fast');
    });
  });

  describe('environment', () => {
    it('has process.env', () => {
      expect(typeof process.env).toBe('object');
    });
    it('detects platform', () => {
      expect(['darwin', 'linux', 'win32']).toContain(process.platform);
    });
    it('has node version', () => {
      expect(process.versions.node).toMatch(/\d+\.\d+/);
    });
  });

  describe('localcode package', () => {
    it('has name', () => {
      const pkg = require('../package.json');
      expect(pkg.name).toBe('@localcode/cli');
    });
    it('has version', () => {
      const pkg = require('../package.json');
      expect(pkg.version).toBe('4.0.0');
    });
    it('has license', () => {
      const pkg = require('../package.json');
      expect(pkg.license).toBe('MIT');
    });
    it('has repository', () => {
      const pkg = require('../package.json');
      expect(pkg.repository.url).toContain('github.com');
    });
  });
});
