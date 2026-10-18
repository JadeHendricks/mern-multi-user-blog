import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import type { MessageResponse, UpdateSocialsRequest } from '@mern-blog/shared';
import { api } from '../lib/api';
import { queryKeys } from '../lib/queryKeys';

// Saves the social links of one user. mutate({ facebook, linkedin, twitter }).
export const useUpdateSocials = (userId: string) => {
  const queryClient = useQueryClient();
  return useMutation<MessageResponse, Error, UpdateSocialsRequest>({
    mutationFn: (socials) =>
      api.put<MessageResponse>(`/api/user/${userId}/socials`, { body: socials }),
    onSuccess: async (res) => {
      toast.success(res.message);
      // Socials show on the profile, user cards and the author block of a post.
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.users.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.posts.all }),
      ]);
    },
    onError: (error) => toast.error(error.message),
  });
};
