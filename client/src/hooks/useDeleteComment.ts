import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import type { MessageResponse } from '@mern-blog/shared';
import { api } from '../lib/api';
import { patchPostInCaches } from '../lib/postCache';

/** Deletes one comment of a post. mutate(commentId). */
export const useDeleteComment = (postId: string) => {
  const queryClient = useQueryClient();
  return useMutation<MessageResponse, Error, string>({
    mutationFn: (commentId) =>
      api.delete<MessageResponse>(`/api/post/comment/${postId}/${commentId}`),
    onSuccess: (res, commentId) => {
      toast.success(res.message);
      patchPostInCaches(queryClient, postId, (post) => ({
        ...post,
        comments: post.comments.filter((comment) => comment._id !== commentId),
      }));
    },
    onError: (error) => toast.error(error.message),
  });
};
