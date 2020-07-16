import React, { useReducer, useEffect } from "react";
import AuthContext from './AuthContext';
import AuthReducer from './AuthReducer';
import { toast } from 'react-toastify';
import { withRouter } from 'react-router-dom';
import axios from 'axios';
import { LOGIN_SUCCESS, USER_LOADED, AUTH_ERROR, LOGOUT  } from '../types';

const AuthState = props => {

  useEffect(() => {
    isLoggedin();
  // eslint-disable-next-line
  }, []);

  const initialState = {
    isAuthenticated: null,
    loading: true,
    user: null
  };

  const isLoggedin = async () => {
    try {
      const res = await axios.get('/api/auth/isloggedin');
      if (res.status === 200) {
        loadUser();
      }
    } catch (err) { 
      //could be made better //TODO
      if (window.location.href === 'http://localhost:3000/' || window.location.href === 'http://localhost:3000/signup' || window.location.href.startsWith('http://localhost:3000/auth/')) {
        dispatch({ type: AUTH_ERROR });
        return;
      } else {
        props.history.push('/signin');
        dispatch({ type: AUTH_ERROR });
      }
    }
  }

  const externalAuthentication = (response) => {
    toast.success('Login successful, welcome to the Mern Authentication Boilerplate.');
    setTimeout(() => {
      dispatch({ type: USER_LOADED, payload: response.data.user});
    }, 4000);
  }

  const externalResponse = async (response) => {
    if (response.graphDomain === 'facebook') {
      const config = { headers: {'Content-Type': 'application/json'} };
      const body = JSON.stringify({ accessToken: response.accessToken, userID: response.userID });
  
      try {
          const res = await axios.post('/api/auth/facebook-login', body, config);
          externalAuthentication(res)  
      } catch (err) {
        dispatch({ type: AUTH_ERROR });
      } 
    } else {
      const config = { headers: {'Content-Type': 'application/json'} };
      const body = JSON.stringify({ idToken: response.tokenId });

      try {
        const res = await axios.post('/api/auth/google-login', body, config);   
        externalAuthentication(res);
      } catch (err) {
          toast.error(err.response.data.message);
          dispatch({ type: AUTH_ERROR });
      } 
    }
  }

  const loadUser = async () => {
    try {
      const res = await axios.get('/api/user');
      dispatch({ type: USER_LOADED, payload: res.data });
    } catch (err) {
      dispatch({ type: AUTH_ERROR });
    }
  }

  const login = async (email, password) => {
    const config = { headers: {'Content-Type': 'application/json'} };
    const body = JSON.stringify({ email, password });

    try {
        await axios.post('/api/auth/login', body, config);
        dispatch({ type: LOGIN_SUCCESS });
        toast.success('Login successful, welcome to the Mern Authentication Boilerplate.');
        loadUser();
    } catch (err) {
      toast.error(err.response.data.message);
      dispatch({ type: AUTH_ERROR });
    }
  }

  const register = async (name, email, password) => {
    const config = { headers: {'Content-Type': 'application/json'} };
    const body = JSON.stringify({ name, email, password });

    try {
        const res = await axios.post('/api/auth/register', body, config);
        toast.success(res.data.message);
    } catch (err) {
      dispatch({ type: AUTH_ERROR });
      toast.success(err.response.data.message);
    }
  }

  const logout = async () => {
    try {
      const res = await axios.get('/api/auth/logout');
      toast.success('Logging out');
      dispatch({ type: LOGOUT });
      if (res.data.message === 'success') {
        setTimeout(() => {
          window.location.reload(true);
        }, 4000);
      }
    } catch (err) {
      dispatch({ type: AUTH_ERROR });
    }
  }

  const forgotPassword = async (email) => {
    const config = { headers: {'Content-Type': 'application/json'} };
    const body = JSON.stringify({ email });

    try {
        const res = await axios.put('/api/auth/forgot-password', body, config);
        toast.success(res.data.message);
    } catch (err) {
        dispatch({ type: AUTH_ERROR });
        toast.error(err.response.data.message);
    }
  }

  const resetPassword = async (newPassword, token) => {
    const config = { headers: {'Content-Type': 'application/json'} };
    const body = JSON.stringify({ newPassword, resetPasswordLink: token });

    try {
        const res = await axios.put('/api/auth/reset-password', body, config);
        toast.success(res.data.message);
        if (res.status === 200) {
          setTimeout(() => {
            props.history.push('/signin');
          }, 4000);
        }
    } catch (err) {
      dispatch({ type: AUTH_ERROR });
      toast.error(err.response.data.message);
    }
  }

  const activateAccount = async (token) => {
    const config = { headers: {'Content-Type': 'application/json'} };
    const body = JSON.stringify({ token });

    try {
        const res = await axios.post('/api/auth/account-activation', body, config);
        toast.success(res.data.message);
        setTimeout(() => {
          if (res.status === 201) {
            props.history.push('/signin');
        }
        }, 4000);
    } catch (err) {
        console.error(err.message);
        toast.error(err.response.data.message);
    }
  }

  const [state, dispatch] = useReducer(AuthReducer, initialState);

  return (
    <AuthContext.Provider value={{
      isAuthenticated: state.isAuthenticated,
      loading: state.loading,
      user: state.user,
      externalAuthentication,
      register,
      login,
      logout,
      resetPassword,
      forgotPassword,
      externalResponse,
      activateAccount,
      loadUser
    }}>
      { props.children }
    </AuthContext.Provider>
  )
}

export default withRouter(AuthState);