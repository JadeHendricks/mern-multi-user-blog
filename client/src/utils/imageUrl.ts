import type { SyntheticEvent } from 'react';
import { DEFAULT_AVATAR } from '@mern-blog/shared';
import defaultPostImage from '../assets/images/posts/default.jpg';
import defaultUserImage from '../assets/images/users/default.jpg';

export type UploadKind = 'posts' | 'users';

// default.jpg is a bundled asset (not served from /uploads); every other name is an upload.
const DEFAULTS: Record<UploadKind, string> = { posts: defaultPostImage, users: defaultUserImage };

// Empty values and default.jpg give the bundled default image.
export function uploadUrl(kind: UploadKind, filename?: string | null): string {
  if (!filename || filename === DEFAULT_AVATAR) return DEFAULTS[kind];
  return `/uploads/${kind}/${encodeURIComponent(filename)}`;
}

// onError handler: swaps a broken upload for the default image. The size comes from CSS, so nothing shifts.
export const onImageError =
  (kind: UploadKind) =>
  (event: SyntheticEvent<HTMLImageElement>): void => {
    const img = event.currentTarget;
    // Stop if the default itself failed, otherwise the swap would repeat forever.
    if (img.getAttribute('src') !== DEFAULTS[kind]) img.src = DEFAULTS[kind];
  };
