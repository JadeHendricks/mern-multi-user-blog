// querySelector for tests that click or inspect what it finds: fails the test when nothing matches,
// instead of passing null on to the next call.
export const mustQuery = (root: ParentNode, selector: string): Element => {
  const element = root.querySelector(selector);
  if (!element) throw new Error(`nothing matches ${selector}`);
  return element;
};
