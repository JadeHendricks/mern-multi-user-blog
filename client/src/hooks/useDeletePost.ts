import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { toast } from 'react-toastify';
import { api } from '../lib/api';
import { queryKeys } from '../lib/queryKeys';

// Deletes a post and goes home. The caller asks for confirmation first. mutate(postId).
export const useDeletePost = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  return useMutation({
    mutationFn: (postId) => api.delete(`/api/post/${postId}`),
    onSuccess: (_res, postId) => {
      toast.success('Post has been deleted.');
      // refetchType none: the post page may still be mounted, and refetching a deleted post would
      // only answer 404. Lists are marked stale and load again when they are shown.
      queryClient.invalidateQueries({ queryKey: queryKeys.posts.all, refetchType: 'none' });
      queryClient.invalidateQueries({ queryKey: queryKeys.users.postsAll(), refetchType: 'none' });
      // Only leave the page once the server confirmed the delete.
      navigate('/');
      queryClient.removeQueries({ queryKey: queryKeys.posts.detail(postId) });
    },
    // The page stays as it was; only the toast tells the user.
    onError: (error) => toast.error(error.message),
  });
};