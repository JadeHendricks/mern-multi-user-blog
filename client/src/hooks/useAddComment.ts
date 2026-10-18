import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import type { AddCommentRequest, CommentsResponse } from '@mern-blog/shared';
import { api } from '../lib/api';
import { patchPostInCaches } from '../lib/postCache';

/** Adds a comment to one post. mutate(text). */
export const useAddComment = (postId: string) => {
  const queryClient = useQueryClient();
  return useMutation<CommentsResponse, Error, string>({
    mutationFn: (comment) => {
      const body: AddCommentRequest = { comment };
      return api.post<CommentsResponse>(`/api/post/comment/${postId}`, { body });
    },
    onSuccess: (res) => {
      toast.success(res.message);
      // The server answers with the full comment list; cards show the count, the post page the list.
      patchPostInCaches(queryClient, postId, (post) => ({ ...post, comments: res.comment }));
    },
    // The page keeps showing what it had; only the toast tells the user.
    onError: (error) => toast.error(error.message),
  });
};
