// Limits and defaults used by both the API and (later) the client. The numbers are the ones the
// server has always enforced; changing one here changes the API.

export const NAME_MAX = 32;
export const TITLE_MAX = 100;
export const DESCRIPTION_MIN = 50;
export const PASSWORD_MIN = 6;
export const SOCIAL_MAX = 200;

export const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
export const IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export type ImageMimeType = (typeof IMAGE_MIME_TYPES)[number];

/** Largest `?limit=` the list endpoints accept. */
export const MAX_LIMIT = 100;

/** Avatar and post image used until the user uploads one. */
export const DEFAULT_AVATAR = 'default.jpg';
