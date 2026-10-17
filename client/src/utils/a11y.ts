// Alt text for an avatar that stands on its own (no visible name next to it): "Ann's avatar".
// While the name has not loaded yet it says just "Avatar". An avatar beside a visible name should
// use alt="" instead, so a screen reader does not read the name twice.
export const avatarAlt = (name?: string | null): string => {
  const trimmed = name?.trim();
  return trimmed ? `${trimmed}'s avatar` : 'Avatar';
};
