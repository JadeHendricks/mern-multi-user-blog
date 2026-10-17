import { Navigate, Outlet } from 'react-router';
import { useAuth } from '../../context/authContext/AuthContext';
import Loader from '../layouts/Loader';

// Layout route that guards its children. Wait for the session check, then send visitors to login
// instead of spinning forever.
const RequireAuth = () => {
  const { isAuthenticated, authLoading } = useAuth();

  if (authLoading) {
    return <Loader />;
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
};

export default RequireAuth;
