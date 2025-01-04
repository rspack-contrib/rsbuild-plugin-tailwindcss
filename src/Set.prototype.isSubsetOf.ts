/**
 * See: {@link https://github.com/tc39/proposal-set-methods | Set Methods for JavaScript}
 */
export function isSubsetOf<T>(a: ReadonlySet<T>, b: ReadonlySet<T>): boolean {
  // Node.js v22 will have native implementation.
  if (typeof a.isSubsetOf === 'function') {
    return a.isSubsetOf(b);
  }

  if (a.size > b.size) {
    return false;
  }

  for (const item of a) {
    if (!b.has(item)) {
      return false;
    }
  }
  return true;
}
