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
    authLoading: true,
    loggedInUser: null
  };

  const isLoggedin = async () => {
    try {
      const res = await axios.get('/api/auth/isloggedin');
      if (res.status === 200) {
        loadUser();
      }
    } catch (err) { 
      //could be made better //TODO
      if (window.location.href === 'https://still-hollows-11115.herokuapp.com/' || window.location.href === 'https://still-hollows-11115.herokuapp.com/users'|| window.location.href === 'https://still-hollows-11115.herokuapp.com/most-popular-posts'  || window.location.href === 'https://still-hollows-11115.herokuapp.com/register' || window.location.href.startsWith('https://still-hollows-11115.herokuapp.com/auth/')) {
        dispatch({ type: AUTH_ERROR });
        return;
      } else {
        props.history.push('/login');
        dispatch({ type: AUTH_ERROR });
      }
    }
  }

  const loadUser = async () => {
    try {
      const res = await axios.get('/api/user/me');
      dispatch({ type: USER_LOADED, payload: res.data.user });
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
        toast.success('Login successful, welcome to the Multi User Blog.');
        loadUser();
        props.history.push('/');
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
      toast.error(err.response.data.message);
    }
  }

  const logout = async () => {
    try {
      const res = await axios.get('/api/auth/logout');
      toast.success('Logging out');
      dispatch({ type: LOGOUT });
      if (res.data.message === 'success') {
          props.history.push('/login')
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
    console.log('newPassword from state', newPassword);
    console.log('token from state', token);
    const config = { headers: {'Content-Type': 'application/json'} };
    const body = JSON.stringify({ newPassword, resetPasswordLink: token });

    try {
        const res = await axios.put('/api/auth/reset-password', body, config);
        toast.success(res.data.message);
        if (res.status === 200) {
          setTimeout(() => {
            props.history.push('/login');
          }, 4000);
        }
    } catch (err) {
      console.log(err);
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
            props.history.push('/login');
        }
        }, 4000);
    } catch (err) {
        console.error(err.message);
        toast.error(err.response.data.message);
    }
  }

  const isUsersData = (loggedInUserId, userId) => {
    if (loggedInUserId && userId) {
        return loggedInUserId === userId;
    }
  }

  const [state, dispatch] = useReducer(AuthReducer, initialState);

  return (
    <AuthContext.Provider value={{
      isAuthenticated: state.isAuthenticated,
      authLoading: state.authLoading,
      loggedInUser: state.loggedInUser,
      register,
      login,
      logout,
      resetPassword,
      forgotPassword,
      activateAccount,
      loadUser,
      isUsersData
    }}>
      { props.children }
    </AuthContext.Provider>
  )
}

export default withRouter(AuthState);