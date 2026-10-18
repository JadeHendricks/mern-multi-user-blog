import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import type { MessageResponse } from '@mern-blog/shared';
import { api } from '../lib/api';
import { queryKeys } from '../lib/queryKeys';

interface ProfileValues {
  name: string;
  avatar?: File | null | undefined;
}

// Saves the signed-in user's name and avatar. mutate({ name, avatar }). The avatar is a file, so
// this goes out as FormData (the avatar is left out when none was picked).
export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  return useMutation<MessageResponse, Error, ProfileValues>({
    mutationFn: ({ name, avatar }) => {
      const body = new FormData();
      body.append('name', name);
      if (avatar) body.append('avatar', avatar);
      return api.put<MessageResponse>('/api/user/me', { body });
    },
    onSuccess: async (res) => {
      toast.success(res.message);
      // Name and avatar show in the header, the profile, user cards and as author of every post.
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.me }),
        queryClient.invalidateQueries({ queryKey: queryKeys.users.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.posts.all }),
      ]);
    },
    onError: (error) => toast.error(error.message),
  });
};
