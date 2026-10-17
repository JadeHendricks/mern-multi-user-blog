// Social links come from user input, so only https URLs may become hrefs (blocks javascript: and data:).
// A type predicate so `isHttpsUrl(socials?.facebook) && <a href={socials.facebook}>` type-checks. It only
// ever narrows to string; do not rely on the false branch.
export const isHttpsUrl = (value: unknown): value is string => {
  if (typeof value !== 'string' || value.trim() === '') {
    return false;
  }
  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
};
