import { CACHE_STORE } from "../config";

export async function readCacheFromFS<V>(cacheStore?: string) {
  const file = Bun.file(cacheStore ?? CACHE_STORE);
  if (!(await file.exists())) {
    return new Map<string, V>();
  }

  return new Map<string, V>(Object.entries<V>(await file.json()));
}

export function writeCacheToFS<V>(map: Map<string, V>, cacheStore?: string) {
  return Bun.write(
    cacheStore ?? CACHE_STORE,
    JSON.stringify(Object.fromEntries(map))
  );
}
