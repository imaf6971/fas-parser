export function parallel<T>(
  fn: (i: number) => Promise<T>,
  threads = 50,
  shouldLog = false
) {
  const promises = Array.from({ length: threads }, (_, i) =>
    shouldLog ? logThreadResult(fn, i) : fn(i)
  );
  return Promise.all(promises);
}

async function logThreadResult<T>(
  fn: (i: number) => Promise<T>,
  threadId: number
) {
  const result = await fn(threadId);
  console.log({ threadId, result });
  return result;
}
