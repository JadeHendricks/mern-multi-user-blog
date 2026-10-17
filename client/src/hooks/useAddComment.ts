import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { api } from '../lib/api';
import { patchPostInCaches } from '../lib/postCache';

/** Adds a comment to one post. mutate(text). @param {string} postId */
export const useAddComment = (postId) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (comment) => api.post(`/api/post/comment/${postId}`, { body: { comment } }),
    onSuccess: (res) => {
      toast.success(res.message);
      // The server answers with the full comment list; cards show the count, the post page the list.
      patchPostInCaches(queryClient, postId, (post) => ({ ...post, comments: res.comment }));
    },
    // The page keeps showing what it had; only the toast tells the user.
    onError: (error) => toast.error(error.message),
  });
};