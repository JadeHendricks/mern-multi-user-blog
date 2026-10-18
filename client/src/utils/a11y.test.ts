import { avatarAlt } from './a11y';

describe('avatarAlt', () => {
  it('names the owner of the avatar', () => {
    expect(avatarAlt('Ann Lee')).toBe("Ann Lee's avatar");
  });

  it('trims the name', () => {
    expect(avatarAlt('  Ann  ')).toBe("Ann's avatar");
  });

  it.each([undefined, null, '', '   '])('falls back to a plain label for %j', (name) => {
    expect(avatarAlt(name)).toBe('Avatar');
  });
});
