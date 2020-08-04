import React, { useReducer } from "react";
import UserContext from './UserContext';
import UserReducer from './UserReducer';
import { toast } from 'react-toastify';
import { withRouter } from 'react-router-dom';
import axios from 'axios';
import { GET_ALL_USERS, GET_ALL_USERS_POSTS, GET_USER, UPDATE_USER, USER_ERROR } from "../types";

const PostState = props => {

  const initialState = {
    users: [],
    user: {},
    userPosts: [],
    userLoading: true
  };

  const [state, dispatch] = useReducer(UserReducer, initialState);

  const getAllUsers = async () => {
    try {
        const res = await axios.get('api/user');
        dispatch({
          type: GET_ALL_USERS,
          payload: res.data.users
        })
    } catch (err) {
        dispatch({ type: USER_ERROR });
        toast.error(err.response.data.message);
    }
  }

  const getUser = async (id) => {
    try {
        const res = await axios.get(`/api/user/${id}`);
        dispatch({
          type: GET_USER,
          payload: res.data.user
        });
    } catch (err) {
        dispatch({ type: USER_ERROR });
        toast.error(err.response.data.message);
    }
  }

  const getAllUsersPosts = async (id) => { 
    try {
        const res = await axios.get(`/api/post/user/${id}`);
        dispatch({
          type: GET_ALL_USERS_POSTS,
          payload: res.data.posts
        });
    } catch (err) {
        dispatch({ type: USER_ERROR });
        toast.error(err.response.data.message);
    }
  }

  const updateUserSocials = async (facebook, linkedin, twitter, userID) => {
    const config = { headers: {'Content-Type': 'application/json'} };
    const body = JSON.stringify({ facebook, linkedin, twitter });
    try {
        const res = await axios.put(`/api/user/${userID}/socials`, body, config);
        toast.success(res.data.message);
        dispatch({
          type: UPDATE_USER,
          payload: res.data.user
        });
    } catch (err) {
        dispatch({ type: USER_ERROR });
        toast.error(err.response.data.message);
    }
  }

  const updateUser = async (name, avatar) => {
    const config = { headers: {'Content-Type': 'application/json'} };
    const body = new FormData();
    body.append('name', name);
    body.append('avatar', avatar);

    try {
        const res = await axios.put(`/api/user/me`, body, config);
        toast.success(res.data.message);
        dispatch({
          type: UPDATE_USER,
          payload: res.data.user
        });
    } catch (err) {
        dispatch({ type: USER_ERROR });
        toast.error(err.response.data.message);
    }
  }

  return (
    <UserContext.Provider value={{
      users: state.users,
      user: state.user,
      userPosts: state.userPosts,
      userLoading: state.userLoading,
      getAllUsers,
      getUser,
      getAllUsersPosts,
      updateUserSocials,
      updateUser
    }}>
      { props.children }
    </UserContext.Provider>
  )
}

export default withRouter(PostState);