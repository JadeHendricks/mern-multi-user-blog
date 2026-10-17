import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { toast } from 'react-toastify';
import type { PostResponse } from '@mern-blog/shared';
import { api } from '../lib/api';
import { queryKeys } from '../lib/queryKeys';
import { postFormData } from './postForm';
import type { EditPostValues } from './postForm';

// Saves an edited post, then opens it. mutate({ title, tag, description, image }).
export const useEditPost = (id: string) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  return useMutation<PostResponse, Error, EditPostValues>({
    mutationFn: (values) =>
      api.put<PostResponse>(`/api/post/${id}`, { body: postFormData({ id, ...values }) }),
    onSuccess: async (res) => {
      toast.success(res.message);
      // Wait for the refetch so the post page opens with the saved text, not the old copy.
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.posts.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.users.postsAll() }),
      ]);
      void navigate(`/post/${id}`);
    },
    onError: (error) => toast.error(error.message),
  });
};
