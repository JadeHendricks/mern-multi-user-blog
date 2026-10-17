// Posts are sent as multipart FormData (the API reads the photo with multer). The image is only
// added when the user picked one, so the field is never the text "undefined".
export const postFormData = ({ id, title, tag, description, image }) => {
  const body = new FormData();
  if (id !== undefined) body.append('id', id);
  body.append('title', title);
  body.append('tag', tag);
  body.append('description', description);
  if (image) body.append('image', image);
  return body;
};