// Social links come from user input, so only https URLs may become hrefs (blocks javascript: and data:).
export const isHttpsUrl = (value: unknown): boolean => {
  if (typeof value !== 'string' || value.trim() === '') {
    return false;
  }
  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
};
