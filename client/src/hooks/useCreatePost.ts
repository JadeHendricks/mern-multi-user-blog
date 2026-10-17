import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { toast } from 'react-toastify';
import type { PostResponse } from '@mern-blog/shared';
import { api } from '../lib/api';
import { queryKeys } from '../lib/queryKeys';
import { postFormData } from './postForm';
import type { EditPostValues } from './postForm';

// Creates a post, then opens it. mutate({ title, tag, description, image }).
export const useCreatePost = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  return useMutation<PostResponse, Error, EditPostValues>({
    mutationFn: (values) => api.post<PostResponse>('/api/post', { body: postFormData(values) }),
    onSuccess: async (res) => {
      toast.success(res.message);
      // New post: every list that is on screen or cached has to learn about it.
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.posts.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.users.postsAll() }),
      ]);
      void navigate(`/post/${res.post._id}`);
    },
    // Stay on the form with what the user typed; the toast says what went wrong.
    onError: (error) => toast.error(error.message),
  });
};
