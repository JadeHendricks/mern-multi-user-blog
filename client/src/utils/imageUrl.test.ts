import type { SyntheticEvent } from 'react';
import { onImageError, uploadUrl } from './imageUrl';

describe('uploadUrl', () => {
  it('returns the bundled default for empty values and default.jpg', () => {
    const post = uploadUrl('posts', 'default.jpg');
    expect(uploadUrl('posts', undefined)).toBe(post);
    expect(uploadUrl('posts', '')).toBe(post);
    expect(uploadUrl('users', null)).toBe(uploadUrl('users', 'default.jpg'));
  });

  it('points uploads at /uploads/<kind>/<name>', () => {
    expect(uploadUrl('posts', 'post-abc.png')).toBe('/uploads/posts/post-abc.png');
    expect(uploadUrl('users', 'user-abc.webp')).toBe('/uploads/users/user-abc.webp');
  });

  it('encodes the file name', () => {
    expect(uploadUrl('posts', 'a b/../c.png')).toBe('/uploads/posts/a%20b%2F..%2Fc.png');
  });
});

describe('onImageError', () => {
  // The handler only reads currentTarget, so the tests hand it just that.
  const errorEvent = (img: HTMLImageElement) => ({ currentTarget: img }) as SyntheticEvent<HTMLImageElement>;
  const makeImg = (src: string) => {
    const img = document.createElement('img');
    img.setAttribute('src', src);
    return img;
  };

  it('swaps a broken upload for the default image', () => {
    const img = makeImg('/uploads/users/gone.png');
    onImageError('users')(errorEvent(img));
    expect(img.getAttribute('src')).toBe(uploadUrl('users', 'default.jpg'));
  });

  it('leaves the default image alone', () => {
    const fallback = uploadUrl('posts', '');
    const img = makeImg(fallback);
    onImageError('posts')(errorEvent(img));
    expect(img.getAttribute('src')).toBe(fallback);
  });
});
