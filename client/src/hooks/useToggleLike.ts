import { useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import type { LikesResponse } from '@mern-blog/shared';
import { useAuth } from '../context/authContext/AuthContext';
import { api } from '../lib/api';
import { patchPostInCaches, restorePostCaches, snapshotPostCaches } from '../lib/postCache';
import type { PostCacheSnapshot } from '../lib/postCache';
import { queryKeys } from '../lib/queryKeys';

interface ToggleLikeVariables {
  postId: string;
  /** Whether the user likes the post now; undefined (unknown) counts as not liked. */
  liked: boolean | undefined;
}

// Like or unlike a post. The heart flips at once in every cache that shows the post (feed, post
// page, profile list); the server's answer then replaces the guess, and a failure puts the old
// state back. Returns toggle(postId, liked), which ignores clicks while its own request is running.
export const useToggleLike = () => {
  const queryClient = useQueryClient();
  const { loggedInUser } = useAuth();
  const meId = loggedInUser?._id;
  // A ref, not mutation.isPending: three clicks inside one render all see the same isPending.
  const running = useRef(false);

  const mutation = useMutation<
    LikesResponse,
    Error,
    ToggleLikeVariables,
    { snapshot: PostCacheSnapshot }
  >({
    mutationFn: ({ postId, liked }) =>
      api.put<LikesResponse>(`/api/post/${liked ? 'unlike' : 'like'}/${postId}`),
    onMutate: async ({ postId, liked }) => {
      const snapshot = await snapshotPostCaches(queryClient);
      // A visitor has no id to guess with; the server will answer 401 and the toast says so.
      if (meId) {
        patchPostInCaches(queryClient, postId, (post) => ({
          ...post,
          likes: liked
            ? post.likes.filter((like) => like.user !== meId)
            : // The guess has no like `_id` yet; the server's answer below replaces it.
              [...post.likes, { user: meId }],
        }));
      }
      return { snapshot };
    },
    onSuccess: (res, { postId }) => {
      patchPostInCaches(queryClient, postId, (post) => ({ ...post, likes: res.likes }));
      toast.success(res.message);
    },
    onError: (error, _variables, context) => {
      if (context) restorePostCaches(queryClient, context.snapshot);
      toast.error(error.message);
    },
    onSettled: () => {
      running.current = false;
      // Not returned on purpose: the heart should not wait for the refetch.
      void queryClient.invalidateQueries({ queryKey: queryKeys.posts.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.users.postsAll() });
    },
  });

  return (postId: string, liked: boolean | undefined): void => {
    if (running.current) return;
    running.current = true;
    mutation.mutate({ postId, liked });
  };
};
