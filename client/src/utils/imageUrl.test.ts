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
  const makeImg = (src) => {
    const img = document.createElement('img');
    img.setAttribute('src', src);
    return img;
  };

  it('swaps a broken upload for the default image', () => {
    const img = makeImg('/uploads/users/gone.png');
    onImageError('users')({ currentTarget: img });
    expect(img.getAttribute('src')).toBe(uploadUrl('users', 'default.jpg'));
  });

  it('leaves the default image alone', () => {
    const fallback = uploadUrl('posts', '');
    const img = makeImg(fallback);
    onImageError('posts')({ currentTarget: img });
    expect(img.getAttribute('src')).toBe(fallback);
  });
});
