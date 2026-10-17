import type { LikeDto, OwnUserDto } from '@mern-blog/shared';

// Small pure helpers for posts. They used to live on PostContext.

// Cards show the first 150 characters.
export const descriptionTrimmer = (desc: string): string => {
  return desc.slice(0, 150) + '...';
};

// True when the signed-in user is one of the likers. Undefined when there is nobody to ask about.
export const postIsLiked = (
  likes: readonly Pick<LikeDto, 'user'>[] | undefined,
  loggedInUser: Pick<OwnUserDto, '_id'> | null | undefined,
): boolean | undefined => {
  if (likes && loggedInUser) {
    return likes.some((like) => like.user === loggedInUser._id);
  }
  return undefined;
};
