import React, { useContext } from 'react';
import AuthContext from '../../context/authContext/AuthContext';
import Loader from '../layouts/Loader';
import { Route } from 'react-router-dom';

const PrivateRoute = ({ component: Component, ...rest }) => {
  const { isAuthenticated } = useContext(AuthContext);

  return (
    <Route {...rest} render={props => !isAuthenticated ? (
      <Loader />
    ) : (
      <Component {...props} />
    )} />
  )
}

export default PrivateRoute;