import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { api } from '../lib/api';
import { patchPostInCaches } from '../lib/postCache';

/** Deletes one comment of a post. mutate(commentId). @param {string} postId */
export const useDeleteComment = (postId) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (commentId) => api.delete(`/api/post/comment/${postId}/${commentId}`),
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