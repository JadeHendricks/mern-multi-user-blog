export interface Queue {
  enqueue<T>(task: () => Promise<T> | T): Promise<T>;
  idle(): Promise<void>;
}

// One promise chain: tasks run strictly one after another, in the order they were enqueued.
// A task that fails rejects only its own caller; the chain keeps going for the next task.
export function createQueue(): Queue {
  let tail: Promise<void> = Promise.resolve();
  return {
    enqueue<T>(task: () => Promise<T> | T): Promise<T> {
      const result = tail.then(() => task());
      tail = result.then(
        () => undefined,
        () => undefined,
      );
      return result;
    },
    // Resolves when everything enqueued so far has finished (used by close()).
    idle: () => tail,
  };
}
