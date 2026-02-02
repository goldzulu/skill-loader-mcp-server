/**
 * Cache Utility
 * 
 * Simple in-memory cache with TTL support
 * 
 * Note: The SkillResolver already implements caching for skills.sh directory.
 * This utility is provided for future extensibility.
 */

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

export class Cache<T> {
  private cache: Map<string, CacheEntry<T>> = new Map();
  private ttl: number;

  /**
   * Create a new cache with specified TTL
   * 
   * @param ttl - Time to live in milliseconds
   */
  constructor(ttl: number) {
    this.ttl = ttl;
  }

  /**
   * Get a value from the cache
   * 
   * @param key - Cache key
   * @returns Cached value or undefined if not found or expired
   */
  get(key: string): T | undefined {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return undefined;
    }
    
    // Check if entry has expired
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return undefined;
    }
    
    return entry.data;
  }

  /**
   * Set a value in the cache
   * 
   * @param key - Cache key
   * @param data - Data to cache
   */
  set(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * Check if a key exists and is not expired
   * 
   * @param key - Cache key
   * @returns True if key exists and is not expired
   */
  has(key: string): boolean {
    return this.get(key) !== undefined;
  }

  /**
   * Delete a key from the cache
   * 
   * @param key - Cache key
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear all entries from the cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   * 
   * @returns Cache statistics
   */
  getStats(): {
    size: number;
    keys: string[];
  } {
    // Clean up expired entries first
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.ttl) {
        this.cache.delete(key);
      }
    }
    
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}
