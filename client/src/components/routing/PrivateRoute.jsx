import React, { useContext } from 'react';
import AuthContext from '../../context/authContext/AuthContext';
import Loader from '../layouts/Loader';
import { Route, Redirect } from 'react-router-dom';

const PrivateRoute = ({ component: Component, ...rest }) => {
  const { isAuthenticated, authLoading } = useContext(AuthContext);

  // Wait for the session check, then send visitors to login instead of spinning forever.
  return (
    <Route {...rest} render={props => {
      if (authLoading) {
        return <Loader />;
      }
      if (!isAuthenticated) {
        return <Redirect to="/login" />;
      }
      return <Component {...props} />;
    }} />
  )
}

export default PrivateRoute;
