import { parallel } from "./parallel";
import {
  categoryPath,
  getConclusionHrefsFromOnePage,
} from "./collect-conclusion-hrefs";
import { THREADS_COUNT, THREADS_COUNT_FAST } from "./config";
import { useCache } from "./caching/caching";
import {
  readCacheFromFS,
  writeCacheToFS,
} from "./collect-conclusion-hrefs/cache";
import { getConclusionPathsFromFs } from "./conclusion-parse/get-from-fs";
import { parseConclusion } from "./conclusion-parse";
import { toCSVRow } from "./csv";
import { getTotalPages } from "./total-pages";

async function main() {
  console.log("Starting parser...");
  {
    const totalPages = await getTotalPages();
    // const totalPages = 201;
    console.log("Total pages:", totalPages);
    const steps = Math.floor(totalPages / THREADS_COUNT);
    console.log(
      `Program will take ${steps} steps with ${THREADS_COUNT} threads`
    );

    const cache = await readCacheFromFS<string[]>();
    for (let i = 0; i < steps + 1; i++) {
      console.time(`Step ${i}`);
      const isLast = i === steps;
      const threads = isLast ? totalPages % THREADS_COUNT : THREADS_COUNT;
      await parallel(
        (threadId) =>
          useCache(
            categoryPath(i * THREADS_COUNT + threadId + 1),
            getConclusionHrefsFromOnePage,
            cache
          ),
        threads
      );
      console.timeEnd(`Step ${i}`);

      if ((i !== 0 && i % 10 === 0) || isLast) {
        isLast && console.log("writing last");
        console.time(`Successfully writed cache to disk`);
        await writeCacheToFS(cache);
        console.timeEnd(`Successfully writed cache to disk`);
      }
    }
  }

  {
    const result = await getConclusionPathsFromFs();
    const steps1 = Math.floor(result.length / THREADS_COUNT_FAST);
    const cache1 = await readCacheFromFS<string>("parsedConclusionsCache.json");
    console.log(
      `Program will take ${steps1} steps with ${THREADS_COUNT_FAST} threads`
    );

    const documentsFile = Bun.file("./documents.csv");
    const documentsWriter = documentsFile.writer();
    const resultFile = Bun.file("./result.csv");
    const resultWriter = resultFile.writer();
    for (let i = 0; i < steps1 + 1; i++) {
      console.time(`Step ${i}`);
      const isLast = i === steps1;
      const threads = isLast
        ? result.length % THREADS_COUNT_FAST
        : THREADS_COUNT_FAST;
      const csvRows = await parallel((threadId) => {
        const idx = i * THREADS_COUNT_FAST + threadId;
        return useCache(
          result[idx],
          async (href) => toCSVRow(await parseConclusion(href)),
          cache1
        );
      }, threads);
      console.timeEnd(`Step ${i}`);

      for (const row of csvRows) {
        if (row.includes("documents")) {
          documentsWriter.write(row + "\r\n");
          continue;
        }
        resultWriter.write(row + "\r\n");
      }

      if ((i !== 0 && i % 10 === 0) || isLast) {
        isLast && console.log("writing last");
        console.time(`Successfully writed cache to disk`);
        await writeCacheToFS(cache1, "parsedConclusionsCache.json");
        console.timeEnd(`Successfully writed cache to disk`);
      }
    }
    resultWriter.end();
    documentsWriter.end();
  }
}

await main();
