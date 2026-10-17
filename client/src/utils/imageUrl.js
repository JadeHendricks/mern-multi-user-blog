import defaultPostImage from '../assets/images/posts/default.jpg';
import defaultUserImage from '../assets/images/users/default.jpg';

// default.jpg is a bundled asset (not served from /uploads); every other name is an upload.
const DEFAULTS = { posts: defaultPostImage, users: defaultUserImage };

// kind is 'posts' or 'users'. Empty values and default.jpg give the bundled default image.
export function uploadUrl(kind, filename) {
  if (!filename || filename === 'default.jpg') return DEFAULTS[kind];
  return `/uploads/${kind}/${encodeURIComponent(filename)}`;
}

// onError handler: swaps a broken upload for the default image. The size comes from CSS, so nothing shifts.
export const onImageError = (kind) => (event) => {
  const img = event.currentTarget;
  // Stop if the default itself failed, otherwise the swap would repeat forever.
  if (img.getAttribute('src') !== DEFAULTS[kind]) img.src = DEFAULTS[kind];
};
