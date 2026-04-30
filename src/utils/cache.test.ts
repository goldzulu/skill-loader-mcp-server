import { Cache } from './cache.js';

describe('Cache', () => {
  it('stores and retrieves values', () => {
    const cache = new Cache<string>(60_000);
    cache.set('key1', 'value1');
    expect(cache.get('key1')).toBe('value1');
  });

  it('returns undefined for missing keys', () => {
    const cache = new Cache<string>(60_000);
    expect(cache.get('missing')).toBeUndefined();
  });

  it('expires entries after TTL', () => {
    const cache = new Cache<string>(1); // 1ms TTL
    cache.set('key1', 'value1');
    // Force expiry by waiting a tick
    const start = Date.now();
    while (Date.now() - start < 5) { /* busy wait */ }
    expect(cache.get('key1')).toBeUndefined();
  });

  it('has() returns true for valid keys', () => {
    const cache = new Cache<number>(60_000);
    cache.set('a', 42);
    expect(cache.has('a')).toBe(true);
    expect(cache.has('b')).toBe(false);
  });

  it('delete() removes entries', () => {
    const cache = new Cache<string>(60_000);
    cache.set('key1', 'value1');
    cache.delete('key1');
    expect(cache.get('key1')).toBeUndefined();
  });

  it('clear() removes all entries', () => {
    const cache = new Cache<string>(60_000);
    cache.set('a', '1');
    cache.set('b', '2');
    cache.clear();
    expect(cache.get('a')).toBeUndefined();
    expect(cache.get('b')).toBeUndefined();
  });

  it('getStats() returns size and keys', () => {
    const cache = new Cache<string>(60_000);
    cache.set('x', '1');
    cache.set('y', '2');
    const stats = cache.getStats();
    expect(stats.size).toBe(2);
    expect(stats.keys).toContain('x');
    expect(stats.keys).toContain('y');
  });

  it('getStats() cleans up expired entries', () => {
    const cache = new Cache<string>(1);
    cache.set('expired', 'value');
    const start = Date.now();
    while (Date.now() - start < 5) { /* busy wait */ }
    const stats = cache.getStats();
    expect(stats.size).toBe(0);
  });
});
