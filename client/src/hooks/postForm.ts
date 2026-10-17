import type { CreatePostRequest } from '@mern-blog/shared';

/** What the create and edit forms hand to the mutations. `id` is only set when editing. */
export interface PostFormValues extends CreatePostRequest {
  id?: string;
  tag: string;
  image?: File | null | undefined;
}

/** The form values of an edit; the hook adds the id. */
export type EditPostValues = Omit<PostFormValues, 'id'>;

// Posts are sent as multipart FormData (the API reads the photo with multer). The image is only
// added when the user picked one, so the field is never the text "undefined".
export const postFormData = ({ id, title, tag, description, image }: PostFormValues): FormData => {
  const body = new FormData();
  if (id !== undefined) body.append('id', id);
  body.append('title', title);
  body.append('tag', tag);
  body.append('description', description);
  if (image) body.append('image', image);
  return body;
};
