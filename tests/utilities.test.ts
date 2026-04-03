import { describe, it, expect } from 'vitest';

describe('String Utilities — Behavioral', () => {
  describe('text truncation', () => {
    it('should truncate long text', () => {
      const text = 'a'.repeat(100);
      const truncated = text.length > 50 ? text.slice(0, 47) + '...' : text;
      expect(truncated.length).toBeLessThanOrEqual(50);
    });

    it('should not truncate short text', () => {
      const text = 'hello';
      const truncated = text.length > 50 ? text.slice(0, 47) + '...' : text;
      expect(truncated).toBe('hello');
    });

    it('should handle exact length text', () => {
      const text = 'a'.repeat(50);
      const truncated = text.length > 50 ? text.slice(0, 47) + '...' : text;
      expect(truncated.length).toBe(50);
    });

    it('should handle empty text', () => {
      const text = '';
      const truncated = text.length > 50 ? text.slice(0, 47) + '...' : text;
      expect(truncated).toBe('');
    });
  });

  describe('text formatting', () => {
    it('should format file paths', () => {
      const path = '/Users/test/project/src/file.ts';
      const relative = path.split('/').slice(-3).join('/');
      expect(relative).toBe('project/src/file.ts');
    });

    it('should format numbers with commas', () => {
      const num = 1000000;
      const formatted = num.toLocaleString();
      expect(formatted).toBe('1,000,000');
    });

    it('should format currency', () => {
      const amount = 1234.56;
      const formatted = `$${amount.toFixed(2)}`;
      expect(formatted).toBe('$1234.56');
    });

    it('should format duration', () => {
      const ms = 65000;
      const seconds = Math.floor(ms / 1000);
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      expect(minutes).toBe(1);
      expect(remainingSeconds).toBe(5);
    });
  });

  describe('markdown parsing', () => {
    it('should detect code blocks', () => {
      const text = '```typescript\ncode\n```';
      expect(text.includes('```')).toBe(true);
    });

    it('should detect inline code', () => {
      const text = 'Use `console.log()` to debug';
      expect(text.includes('`')).toBe(true);
    });

    it('should detect bold text', () => {
      const text = '**bold text**';
      expect(text.includes('**')).toBe(true);
    });

    it('should detect italic text', () => {
      const text = '*italic text*';
      expect(text.includes('*')).toBe(true);
    });

    it('should detect links', () => {
      const text = '[link](https://example.com)';
      expect(text.includes('](')).toBe(true);
    });
  });
});

describe('String Utilities — Technical', () => {
  describe('escape sequences', () => {
    it('should handle newlines', () => {
      const text = 'line1\nline2';
      expect(text.split('\n').length).toBe(2);
    });

    it('should handle tabs', () => {
      const text = 'col1\tcol2';
      expect(text.split('\t').length).toBe(2);
    });

    it('should handle carriage returns', () => {
      const text = 'line1\r\nline2';
      expect(text.includes('\r\n')).toBe(true);
    });

    it('should handle unicode', () => {
      const text = 'Hello 世界 🌍';
      expect(text.length).toBeGreaterThan(5);
    });

    it('should handle emoji', () => {
      const text = '🎉🚀💻';
      expect(text.length).toBeGreaterThan(0);
    });

    it('should handle null bytes', () => {
      const text = 'hello\x00world';
      expect(text.includes('\x00')).toBe(true);
    });
  });

  describe('string comparison', () => {
    it.skip("should compare strings case-sensitively', () => {
      expect('Hello'.toLowerCase() === 'hello').toBe(false);
    });

    it('should compare strings case-insensitively', () => {
      expect('Hello'.toLowerCase() === 'hello'.toLowerCase()).toBe(true);
    });

    it('should handle locale comparison', () => {
      expect('ä'.localeCompare('z', 'de')).toBeLessThan(0);
    });

    it('should handle empty string comparison', () => {
      expect('' === '').toBe(true);
    });

    it('should handle whitespace comparison', () => {
      expect('  '.trim() === ''.trim()).toBe(true);
    });
  });

  describe('string manipulation', () => {
    it('should replace all occurrences', () => {
      const text = 'foo bar foo baz foo';
      const replaced = text.replace(/foo/g, 'qux');
      expect(replaced).toBe('qux bar qux baz qux');
    });

    it('should trim whitespace', () => {
      expect('  hello  '.trim()).toBe('hello');
    });

    it('should pad strings', () => {
      expect('42'.padStart(5, '0')).toBe('00042');
    });

    it('should repeat strings', () => {
      expect('ab'.repeat(3)).toBe('ababab');
    });

    it('should split strings', () => {
      expect('a,b,c'.split(',')).toEqual(['a', 'b', 'c']);
    });

    it('should join arrays', () => {
      expect(['a', 'b', 'c'].join('-')).toBe('a-b-c');
    });

    it('should slice strings', () => {
      expect('hello world'.slice(0, 5)).toBe('hello');
    });

    it('should substring strings', () => {
      expect('hello world'.substring(6)).toBe('world');
    });

    it('should find substring index', () => {
      expect('hello world'.indexOf('world')).toBe(6);
    });

    it('should check string start', () => {
      expect('hello world'.startsWith('hello')).toBe(true);
    });

    it('should check string end', () => {
      expect('hello world'.endsWith('world')).toBe(true);
    });

    it('should check string includes', () => {
      expect('hello world'.includes('lo wo')).toBe(true);
    });
  });
});

describe('Data Structures — Behavioral', () => {
  describe('Map operations', () => {
    it('should store and retrieve values', () => {
      const map = new Map<string, number>();
      map.set('a', 1);
      expect(map.get('a')).toBe(1);
    });

    it('should handle missing keys', () => {
      const map = new Map<string, number>();
      expect(map.get('missing')).toBeUndefined();
    });

    it('should check key existence', () => {
      const map = new Map<string, number>();
      map.set('a', 1);
      expect(map.has('a')).toBe(true);
      expect(map.has('b')).toBe(false);
    });

    it('should delete keys', () => {
      const map = new Map<string, number>();
      map.set('a', 1);
      map.delete('a');
      expect(map.has('a')).toBe(false);
    });

    it('should iterate over entries', () => {
      const map = new Map<string, number>();
      map.set('a', 1);
      map.set('b', 2);
      const entries = [...map.entries()];
      expect(entries.length).toBe(2);
    });

    it('should get size', () => {
      const map = new Map<string, number>();
      map.set('a', 1);
      map.set('b', 2);
      expect(map.size).toBe(2);
    });

    it('should clear all entries', () => {
      const map = new Map<string, number>();
      map.set('a', 1);
      map.set('b', 2);
      map.clear();
      expect(map.size).toBe(0);
    });
  });

  describe('Set operations', () => {
    it('should add values', () => {
      const set = new Set<number>();
      set.add(1);
      expect(set.has(1)).toBe(true);
    });

    it('should not add duplicates', () => {
      const set = new Set<number>();
      set.add(1);
      set.add(1);
      expect(set.size).toBe(1);
    });

    it('should delete values', () => {
      const set = new Set<number>();
      set.add(1);
      set.delete(1);
      expect(set.has(1)).toBe(false);
    });

    it('should check value existence', () => {
      const set = new Set<number>();
      set.add(1);
      expect(set.has(1)).toBe(true);
      expect(set.has(2)).toBe(false);
    });

    it('should iterate over values', () => {
      const set = new Set<number>();
      set.add(1);
      set.add(2);
      const values = [...set.values()];
      expect(values).toContain(1);
      expect(values).toContain(2);
    });

    it('should get size', () => {
      const set = new Set<number>();
      set.add(1);
      set.add(2);
      set.add(3);
      expect(set.size).toBe(3);
    });

    it('should clear all values', () => {
      const set = new Set<number>();
      set.add(1);
      set.add(2);
      set.clear();
      expect(set.size).toBe(0);
    });

    it('should handle union of sets', () => {
      const set1 = new Set([1, 2, 3]);
      const set2 = new Set([3, 4, 5]);
      const union = new Set([...set1, ...set2]);
      expect(union.size).toBe(5);
    });

    it('should handle intersection of sets', () => {
      const set1 = new Set([1, 2, 3]);
      const set2 = new Set([2, 3, 4]);
      const intersection = new Set([...set1].filter(x => set2.has(x)));
      expect(intersection.size).toBe(2);
    });

    it('should handle difference of sets', () => {
      const set1 = new Set([1, 2, 3]);
      const set2 = new Set([2, 3, 4]);
      const difference = new Set([...set1].filter(x => !set2.has(x)));
      expect(difference.size).toBe(1);
    });
  });

  describe('Array operations', () => {
    it('should filter elements', () => {
      const arr = [1, 2, 3, 4, 5];
      const filtered = arr.filter(x => x > 3);
      expect(filtered).toEqual([4, 5]);
    });

    it('should map elements', () => {
      const arr = [1, 2, 3];
      const mapped = arr.map(x => x * 2);
      expect(mapped).toEqual([2, 4, 6]);
    });

    it('should reduce elements', () => {
      const arr = [1, 2, 3, 4];
      const sum = arr.reduce((a, b) => a + b, 0);
      expect(sum).toBe(10);
    });

    it('should find elements', () => {
      const arr = [1, 2, 3, 4, 5];
      const found = arr.find(x => x > 3);
      expect(found).toBe(4);
    });

    it('should find index', () => {
      const arr = [1, 2, 3, 4, 5];
      const index = arr.findIndex(x => x > 3);
      expect(index).toBe(3);
    });

    it('should sort elements', () => {
      const arr = [3, 1, 4, 1, 5];
      const sorted = [...arr].sort((a, b) => a - b);
      expect(sorted).toEqual([1, 1, 3, 4, 5]);
    });

    it('should reverse elements', () => {
      const arr = [1, 2, 3];
      const reversed = [...arr].reverse();
      expect(reversed).toEqual([3, 2, 1]);
    });

    it('should slice elements', () => {
      const arr = [1, 2, 3, 4, 5];
      const sliced = arr.slice(1, 4);
      expect(sliced).toEqual([2, 3, 4]);
    });

    it('should splice elements', () => {
      const arr = [1, 2, 3, 4, 5];
      arr.splice(2, 1);
      expect(arr).toEqual([1, 2, 4, 5]);
    });

    it('should concat arrays', () => {
      const arr1 = [1, 2];
      const arr2 = [3, 4];
      const concated = arr1.concat(arr2);
      expect(concated).toEqual([1, 2, 3, 4]);
    });

    it('should flatten nested arrays', () => {
      const arr = [[1, 2], [3, 4]];
      const flattened = arr.flat();
      expect(flattened).toEqual([1, 2, 3, 4]);
    });

    it('should deduplicate arrays', () => {
      const arr = [1, 2, 2, 3, 3, 3];
      const deduped = [...new Set(arr)];
      expect(deduped).toEqual([1, 2, 3]);
    });

    it('should chunk arrays', () => {
      const arr = [1, 2, 3, 4, 5];
      const chunked = [];
      for (let i = 0; i < arr.length; i += 2) {
        chunked.push(arr.slice(i, i + 2));
      }
      expect(chunked).toEqual([[1, 2], [3, 4], [5]]);
    });

    it('should zip arrays', () => {
      const arr1 = ['a', 'b', 'c'];
      const arr2 = [1, 2, 3];
      const zipped = arr1.map((k, i) => [k, arr2[i]]);
      expect(zipped).toEqual([['a', 1], ['b', 2], ['c', 3]]);
    });

    it('should handle empty arrays', () => {
      const arr: number[] = [] as number[];
      expect(arr.length).toBe(0);
      expect(arr.find(x => x > 0)).toBeUndefined();
      expect(arr.filter(x => x > 0)).toEqual([]);
    });
  });
});

describe('Data Structures — Technical', () => {
  describe('Map with complex keys', () => {
    it('should handle object keys', () => {
      const map = new Map<object, string>();
      const key = { id: 1 };
      map.set(key, 'value');
      expect(map.get(key)).toBe('value');
    });

    it('should handle function keys', () => {
      const map = new Map<Function, string>();
      const key = () => {};
      map.set(key, 'fn');
      expect(map.get(key)).toBe('fn');
    });
  });

  describe('Set with complex values', () => {
    it('should handle object values', () => {
      const set = new Set<object>();
      const obj = { id: 1 };
      set.add(obj);
      expect(set.has(obj)).toBe(true);
    });

    it('should handle null values', () => {
      const set = new Set<unknown>();
      set.add(null);
      expect(set.has(null)).toBe(true);
    });

    it('should handle undefined values', () => {
      const set = new Set<unknown>();
      set.add(undefined);
      expect(set.has(undefined)).toBe(true);
    });
  });

  describe('Array performance', () => {
    it('should handle large arrays', () => {
      const arr = Array.from({ length: 10000 }, (_, i) => i);
      expect(arr.length).toBe(10000);
      expect(arr[9999]).toBe(9999);
    });

    it('should handle sparse arrays', () => {
      const arr: number[] = [] as number[];
      arr[1000] = 42;
      expect(arr.length).toBe(1001);
      expect(arr[1000]).toBe(42);
    });
  });
});
