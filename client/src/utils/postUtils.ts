// Small pure helpers for posts. They used to live on PostContext.

// Cards show the first 150 characters.
export const descriptionTrimmer = (desc) => {
  return desc.slice(0, 150) + '...';
};

// True when the signed-in user is one of the likers. Undefined when there is nobody to ask about.
export const postIsLiked = (likes, loggedInUser) => {
  if (likes && loggedInUser) {
    return likes.some(like => like.user === loggedInUser._id);
  }
};