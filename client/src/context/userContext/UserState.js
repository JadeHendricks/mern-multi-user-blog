import React, { useReducer } from "react";
import UserContext from './UserContext';
import UserReducer from './UserReducer';
import { toast } from 'react-toastify';
import { withRouter } from 'react-router-dom';
import axios from 'axios';
import { GET_ALL_USERS, GET_ALL_USERS_POSTS, GET_USER } from "../types";

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
        console.error(err);
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
        console.error(err);
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
        console.error(err);
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
      getAllUsersPosts
    }}>
      { props.children }
    </UserContext.Provider>
  )
}

export default withRouter(PostState);