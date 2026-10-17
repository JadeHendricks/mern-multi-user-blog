import { useEffect } from 'react';
import { toast } from 'react-toastify';

// Failed reads show the server message in a toast, as the old context actions did. The effect
// runs once per error object, not on every render.
export const useErrorToast = (error) => {
  useEffect(() => {
    if (error) toast.error(error.message);
  }, [error]);
};