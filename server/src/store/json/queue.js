// One promise chain: tasks run strictly one after another, in the order they were enqueued.
// A task that fails rejects only its own caller; the chain keeps going for the next task.
export function createQueue() {
  let tail = Promise.resolve();
  return {
    enqueue(task) {
      const result = tail.then(() => task());
      tail = result.catch(() => {});
      return result;
    },
    // Resolves when everything enqueued so far has finished (used by close()).
    idle: () => tail,
  };
}
