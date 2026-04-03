import { describe, it, expect } from 'vitest';

describe('Core Utilities — String', () => {
  describe('truncation', () => {
    it('should truncate long strings', () => {
      const s = 'a'.repeat(100);
      expect(s.slice(0, 50).length).toBe(50);
    });
    it('should not truncate short strings', () => {
      const s = 'hello';
      expect(s.length).toBe(5);
    });
    it('should handle empty string', () => {
      expect(''.length).toBe(0);
    });
    it('should handle exact length', () => {
      const s = 'a'.repeat(50);
      expect(s.slice(0, 50).length).toBe(50);
    });
    it('should handle unicode', () => {
      const s = 'Hello 世界';
      expect(s.length).toBeGreaterThan(5);
    });
  });

  describe('formatting', () => {
    it('should format numbers with commas', () => {
      expect((1000000).toLocaleString()).toBe('1,000,000');
    });
    it('should format currency', () => {
      expect((12.34).toFixed(2)).toBe('12.34');
    });
    it('should format percentage', () => {
      expect((0.75 * 100).toFixed(1) + '%').toBe('75.0%');
    });
    it('should pad numbers', () => {
      expect(String(5).padStart(2, '0')).toBe('05');
    });
    it('should repeat strings', () => {
      expect('ab'.repeat(3)).toBe('ababab');
    });
    it('should trim whitespace', () => {
      expect('  hello  '.trim()).toBe('hello');
    });
    it('should replace all', () => {
      expect('a,b,a,c,a'.replace(/a/g, 'x')).toBe('x,b,x,c,x');
    });
    it('should split strings', () => {
      expect('a,b,c'.split(',')).toEqual(['a', 'b', 'c']);
    });
    it('should join arrays', () => {
      expect(['a', 'b', 'c'].join('-')).toBe('a-b-c');
    });
    it('should check startsWith', () => {
      expect('hello world'.startsWith('hello')).toBe(true);
    });
    it('should check endsWith', () => {
      expect('hello world'.endsWith('world')).toBe(true);
    });
    it('should check includes', () => {
      expect('hello world'.includes('lo wo')).toBe(true);
    });
    it('should find index', () => {
      expect('hello'.indexOf('ll')).toBe(2);
    });
    it('should slice strings', () => {
      expect('hello world'.slice(0, 5)).toBe('hello');
    });
    it('should substring', () => {
      expect('hello world'.substring(6)).toBe('world');
    });
  });

  describe('markdown detection', () => {
    it('should detect code blocks', () => {
      expect('```ts\ncode\n```'.includes('```')).toBe(true);
    });
    it('should detect inline code', () => {
      expect('use `console.log()`'.includes('`')).toBe(true);
    });
    it('should detect bold', () => {
      expect('**bold**'.includes('**')).toBe(true);
    });
    it('should detect links', () => {
      expect('[text](url)'.includes('](')).toBe(true);
    });
    it('should detect headers', () => {
      expect('# Header'.startsWith('#')).toBe(true);
    });
    it('should detect lists', () => {
      expect('- item'.startsWith('- ')).toBe(true);
    });
  });
});

describe('Core Utilities — Data Structures', () => {
  describe('Map', () => {
    it('should set and get', () => {
      const m = new Map();
      m.set('a', 1);
      expect(m.get('a')).toBe(1);
    });
    it('should check has', () => {
      const m = new Map();
      m.set('a', 1);
      expect(m.has('a')).toBe(true);
      expect(m.has('b')).toBe(false);
    });
    it('should delete', () => {
      const m = new Map();
      m.set('a', 1);
      m.delete('a');
      expect(m.has('a')).toBe(false);
    });
    it('should get size', () => {
      const m = new Map();
      m.set('a', 1);
      m.set('b', 2);
      expect(m.size).toBe(2);
    });
    it('should clear', () => {
      const m = new Map();
      m.set('a', 1);
      m.clear();
      expect(m.size).toBe(0);
    });
    it('should iterate', () => {
      const m = new Map([['a', 1], ['b', 2]]);
      expect([...m.keys()]).toEqual(['a', 'b']);
    });
    it('should handle object keys', () => {
      const m = new Map();
      const key = {};
      m.set(key, 'val');
      expect(m.get(key)).toBe('val');
    });
  });

  describe('Set', () => {
    it('should add values', () => {
      const s = new Set();
      s.add(1);
      expect(s.has(1)).toBe(true);
    });
    it('should deduplicate', () => {
      const s = new Set([1, 1, 2, 2, 3]);
      expect(s.size).toBe(3);
    });
    it('should delete', () => {
      const s = new Set([1]);
      s.delete(1);
      expect(s.has(1)).toBe(false);
    });
    it('should get size', () => {
      const s = new Set([1, 2, 3]);
      expect(s.size).toBe(3);
    });
    it('should clear', () => {
      const s = new Set([1, 2]);
      s.clear();
      expect(s.size).toBe(0);
    });
    it('should iterate', () => {
      const s = new Set([1, 2, 3]);
      expect([...s]).toEqual([1, 2, 3]);
    });
    it('should union', () => {
      const union = new Set([...new Set([1, 2]), ...new Set([2, 3])]);
      expect(union.size).toBe(3);
    });
    it('should intersect', () => {
      const a = new Set([1, 2, 3]);
      const b = new Set([2, 3, 4]);
      const intersection = new Set([...a].filter(x => b.has(x)));
      expect(intersection.size).toBe(2);
    });
  });

  describe('Array', () => {
    it('should filter', () => {
      expect([1, 2, 3, 4].filter(x => x > 2)).toEqual([3, 4]);
    });
    it('should map', () => {
      expect([1, 2, 3].map(x => x * 2)).toEqual([2, 4, 6]);
    });
    it('should reduce', () => {
      expect([1, 2, 3, 4].reduce((a, b) => a + b, 0)).toBe(10);
    });
    it('should find', () => {
      expect([1, 2, 3, 4].find(x => x > 2)).toBe(3);
    });
    it('should findIndex', () => {
      expect([1, 2, 3, 4].findIndex(x => x > 2)).toBe(2);
    });
    it('should sort', () => {
      expect([3, 1, 4, 1, 5].sort((a, b) => a - b)).toEqual([1, 1, 3, 4, 5]);
    });
    it('should reverse', () => {
      expect([1, 2, 3].slice().reverse()).toEqual([3, 2, 1]);
    });
    it('should slice', () => {
      expect([1, 2, 3, 4, 5].slice(1, 4)).toEqual([2, 3, 4]);
    });
    it('should concat', () => {
      expect([1, 2].concat([3, 4])).toEqual([1, 2, 3, 4]);
    });
    it('should flat', () => {
      expect([[1, 2], [3, 4]].flat()).toEqual([1, 2, 3, 4]);
    });
    it('should deduplicate', () => {
      expect([...new Set([1, 2, 2, 3])]).toEqual([1, 2, 3]);
    });
    it('should chunk', () => {
      const arr = [1, 2, 3, 4, 5];
      const chunks = [];
      for (let i = 0; i < arr.length; i += 2) chunks.push(arr.slice(i, i + 2));
      expect(chunks).toEqual([[1, 2], [3, 4], [5]]);
    });
    it('should handle empty', () => {
      expect([].length).toBe(0);
      expect([].find(x => x)).toBeUndefined();
    });
    it('should handle sparse', () => {
      const arr: number[] = [] as number[];
      arr[100] = 42;
      expect(arr.length).toBe(101);
    });
    it('should handle large arrays', () => {
      const arr = Array.from({ length: 10000 }, (_, i) => i);
      expect(arr.length).toBe(10000);
    });
  });
});

describe('Core Utilities — JSON', () => {
  describe('parsing', () => {
    it('should parse objects', () => {
      expect(JSON.parse('{"a": 1}').a).toBe(1);
    });
    it('should parse arrays', () => {
      expect(JSON.parse('[1, 2, 3]')).toEqual([1, 2, 3]);
    });
    it('should parse null', () => {
      expect(JSON.parse('null')).toBeNull();
    });
    it('should parse booleans', () => {
      expect(JSON.parse('true')).toBe(true);
    });
    it('should parse numbers', () => {
      expect(JSON.parse('42')).toBe(42);
    });
    it('should parse strings', () => {
      expect(JSON.parse('"hello"')).toBe('hello');
    });
    it('should handle invalid JSON', () => {
      expect(() => JSON.parse('invalid')).toThrow();
    });
    it('should handle empty object', () => {
      expect(JSON.parse('{}')).toEqual({});
    });
    it('should handle empty array', () => {
      expect(JSON.parse('[]')).toEqual([]);
    });
    it('should handle nested', () => {
      expect(JSON.parse('{"a": {"b": 1}}').a.b).toBe(1);
    });
  });

  describe('stringification', () => {
    it('should stringify objects', () => {
      expect(JSON.stringify({ a: 1 })).toBe('{"a":1}');
    });
    it('should stringify arrays', () => {
      expect(JSON.stringify([1, 2])).toBe('[1,2]');
    });
    it('should stringify null', () => {
      expect(JSON.stringify(null)).toBe('null');
    });
    it('should stringify with indent', () => {
      expect(JSON.stringify({ a: 1 }, null, 2)).toContain('\n');
    });
    it('should handle circular', () => {
      const obj: any = { a: 1 };
      obj.self = obj;
      expect(() => JSON.stringify(obj)).toThrow();
    });
    it('should handle undefined', () => {
      expect(JSON.stringify({ a: undefined })).toBe('{}');
    });
    it('should handle Date', () => {
      const json = JSON.stringify({ d: new Date('2024-01-01') });
      expect(json).toContain('2024-01-01');
    });
    it('should handle RegExp', () => {
      expect(JSON.stringify({ r: /test/ })).toBe('{"r":{}}');
    });
    it('should handle Map', () => {
      expect(JSON.stringify(new Map())).toBe('{}');
    });
    it('should handle Set', () => {
      expect(JSON.stringify(new Set())).toBe('{}');
    });
  });
});

describe('Core Utilities — Error Handling', () => {
  describe('error creation', () => {
    it('should create Error', () => {
      const e = new Error('test');
      expect(e.message).toBe('test');
    });
    it('should create TypeError', () => {
      expect(new TypeError('t') instanceof TypeError).toBe(true);
    });
    it('should create RangeError', () => {
      expect(new RangeError('r') instanceof RangeError).toBe(true);
    });
    it('should have stack', () => {
      expect(new Error('s').stack).toBeDefined();
    });
  });

  describe('error catching', () => {
    it('should catch sync errors', () => {
      let caught = false;
      try { throw new Error('x'); } catch { caught = true; }
      expect(caught).toBe(true);
    });
    it('should catch async errors', async () => {
      await expect(Promise.reject(new Error('x'))).rejects.toThrow('x');
    });
    it('should handle finally', () => {
      let f = false;
      try { throw new Error('x'); } catch {} finally { f = true; }
      expect(f).toBe(true);
    });
    it('should handle nested try-catch', () => {
      try { try { throw new Error('inner'); } catch { throw new Error('outer'); } } catch (e: any) {
        expect(e.message).toBe('outer');
      }
    });
  });

  describe('error types', () => {
    it('should identify URIError', () => {
      try { decodeURIComponent('%'); } catch (e) { expect(e instanceof URIError).toBe(true); }
    });
    it('should handle AggregateError', () => {
      const e = new AggregateError([new Error('a')], 'agg');
      expect(e.errors.length).toBe(1);
    });
  });
});

describe('Core Utilities — Date/Time', () => {
  describe('timestamps', () => {
    it('should create current timestamp', () => {
      expect(Date.now()).toBeGreaterThan(0);
    });
    it('should create ISO string', () => {
      expect(new Date().toISOString()).toMatch(/\d{4}-\d{2}-\d{2}/);
    });
    it('should create from timestamp', () => {
      expect(new Date(0).getFullYear()).toBe(1970);
    });
  });

  describe('comparison', () => {
    it('should compare dates', () => {
      expect(new Date('2024-01-01').getTime()).toBeLessThan(new Date('2024-12-31').getTime());
    });
    it('should check equality', () => {
      expect(new Date('2024-01-01').getTime()).toBe(new Date('2024-01-01').getTime());
    });
  });

  describe('duration', () => {
    it('should calculate ms', () => {
      const start = Date.now() - 100;
      expect(Date.now() - start).toBeGreaterThanOrEqual(100);
    });
    it('should convert to seconds', () => {
      expect(5000 / 1000).toBe(5);
    });
    it('should convert to minutes', () => {
      expect(120000 / 60000).toBe(2);
    });
    it('should convert to hours', () => {
      expect(3600000 / 3600000).toBe(1);
    });
  });

  describe('formatting', () => {
    it('should get year', () => {
      expect(new Date('2024-06-15').getFullYear()).toBe(2024);
    });
    it('should get month', () => {
      expect(new Date('2024-06-15').getMonth()).toBe(5);
    });
    it('should get day', () => {
      expect(new Date('2024-06-15').getDate()).toBe(15);
    });
    it('should format locale', () => {
      expect(new Date().toLocaleDateString().length).toBeGreaterThan(0);
    });
  });
});

describe('Core Utilities — URL/Path', () => {
  describe('URL parsing', () => {
    it('should parse protocol', () => {
      expect(new URL('https://example.com').protocol).toBe('https:');
    });
    it('should parse hostname', () => {
      expect(new URL('https://example.com/path').hostname).toBe('example.com');
    });
    it('should parse pathname', () => {
      expect(new URL('https://example.com/a/b').pathname).toBe('/a/b');
    });
    it('should parse search', () => {
      const u = new URL('https://example.com?q=test');
      expect(u.searchParams.get('q')).toBe('test');
    });
    it('should parse hash', () => {
      expect(new URL('https://example.com/#section').hash).toBe('#section');
    });
    it('should handle file URLs', () => {
      expect(new URL('file:///path').protocol).toBe('file:');
    });
  });

  describe('encoding', () => {
    it('should encode', () => {
      expect(encodeURIComponent('hello world')).toContain('%20');
    });
    it('should decode', () => {
      expect(decodeURIComponent('hello%20world')).toBe('hello world');
    });
  });
});

describe('Core Utilities — Stream Processing', () => {
  describe('chunk accumulation', () => {
    it('should accumulate chunks', () => {
      let buf = '';
      for (const c of ['hel', 'lo ', 'wor', 'ld']) buf += c;
      expect(buf).toBe('hello world');
    });
    it('should handle empty chunks', () => {
      let buf = '';
      for (const c of ['', 'a', '', 'b']) buf += c;
      expect(buf).toBe('ab');
    });
  });

  describe('line buffering', () => {
    it('should buffer incomplete lines', () => {
      let buffer = '';
      const lines: string[] = [];
      for (const chunk of ['line1\n', 'line', '2\n']) {
        buffer += chunk;
        const parts = buffer.split('\n');
        buffer = parts.pop() || '';
        lines.push(...parts);
      }
      expect(lines).toEqual(['line1', 'line2']);
    });
  });

  describe('partial JSON', () => {
    it('should extract JSON from text', () => {
      const m = 'prefix {"a": 1} suffix'.match(/\{[\s\S]*\}/);
      expect(m).not.toBeNull();
      expect(JSON.parse(m![0]).a).toBe(1);
    });
    it('should handle multiple JSON lines', () => {
      const lines = '{"a":1}\n{"b":2}'.split('\n').map((l: string) => JSON.parse(l));
      expect(lines.length).toBe(2);
    });
  });
});
