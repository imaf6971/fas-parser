import { CACHE_STORE } from "../config";

export async function getConclusionPathsFromFs() {
  const json: Record<string, string[]> = await Bun.file(CACHE_STORE).json();
  return Object.values(json).flat();
}
