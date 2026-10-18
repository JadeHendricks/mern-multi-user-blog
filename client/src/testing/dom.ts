// querySelector for tests that click or inspect what it finds: fails the test when nothing matches,
// instead of passing null on to the next call.
export const mustQuery = (root: ParentNode, selector: string): Element => {
  const element = root.querySelector(selector);
  if (!element) throw new Error(`nothing matches ${selector}`);
  return element;
};

// Fails when a form field has no accessible name source: every input, textarea and select (but not
// type=hidden) needs an associated <label>, or aria-label / aria-labelledby. Also fails when the root
// holds no field at all, so a wrong root cannot pass by accident.
export const expectEveryFieldLabelled = (root: ParentNode): void => {
  const fields = Array.from(root.querySelectorAll<HTMLInputElement>('input, textarea, select')).filter(
    (field) => field.type !== 'hidden',
  );
  if (fields.length === 0) throw new Error('no form fields found to check');
  const unlabelled = fields
    .filter(
      (field) =>
        (field.labels?.length ?? 0) === 0 &&
        !field.getAttribute('aria-label') &&
        !field.getAttribute('aria-labelledby'),
    )
    .map((field) => field.outerHTML);
  expect(unlabelled, 'form fields without a label').toEqual([]);
};
