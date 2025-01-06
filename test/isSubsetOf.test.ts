import { expect, test } from '@playwright/test';

import { isSubsetOf } from '../src/Set.prototype.isSubsetOf';

test.describe('Set.prototype.isSubsetOf', () => {
  test('subsets', () => {
    const set1 = new Set([1, 2, 3]);
    const set2 = new Set([4, 5, 6]);
    const set3 = new Set([1, 2, 3, 4, 5, 6]);

    expect(isSubsetOf(set1, set2)).toBe(false);
    expect(isSubsetOf(set2, set1)).toBe(false);
    expect(isSubsetOf(set1, set3)).toBe(true);
    expect(isSubsetOf(set2, set3)).toBe(true);
  });

  test('empty sets', () => {
    const s1 = new Set([]);
    const s2 = new Set([1, 2]);

    expect(isSubsetOf(s1, s2)).toBe(true);

    const s3 = new Set([1, 2]);
    const s4 = new Set([]);

    expect(isSubsetOf(s3, s4)).toBe(false);

    const s5 = new Set([]);
    const s6 = new Set([]);

    expect(isSubsetOf(s5, s6)).toBe(true);
  });

  test('self', () => {
    const s1 = new Set([1, 2]);

    expect(isSubsetOf(s1, s1)).toBe(true);
  });

  test('same', () => {
    const s1 = new Set([1, 2]);
    const s2 = new Set([1, 2]);

    expect(isSubsetOf(s1, s2)).toBe(true);
  });
});
