export async function useCache<K, V>(
  key: K,
  fn: (key: K) => Promise<V>,
  cache: Map<K, V>
): Promise<V> {
  const cachedData = cache.get(key);
  if (cachedData !== undefined) {
    return cachedData;
  }
  const result = await fn(key);
  cache.set(key, result);
  return result;
}
