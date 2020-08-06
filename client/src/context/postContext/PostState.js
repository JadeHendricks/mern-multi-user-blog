import React, { useReducer } from "react";
import PostContext from './PostContext';
import PostReducer from './PostReducer';
import { toast } from 'react-toastify';
import { withRouter } from 'react-router-dom';
import axios from 'axios';
import { GET_ALL_POSTS, CREATE_COMMENT, GET_POST, DELETE_COMMENT, UPDATE_LIKES, POST_ERROR } from "../types";

const PostState = props => {

  const initialState = {
    posts: [],
    post: {},
    postLoading: true
  };

  const [state, dispatch] = useReducer(PostReducer, initialState);

  const getAllPosts = async () => { 
    try {
        const res = await axios.get('/api/post');
        dispatch({
          type: GET_ALL_POSTS,
          payload: res.data.posts
        });
    } catch (err) {
      dispatch({ type: POST_ERROR });
      toast.error(err.response.data.message);
    }
  }

  const getPost = async (id) => {
    try {
        const res = await axios.get(`/api/post/${id}`);
        dispatch({
          type: GET_POST,
          payload: res.data.post
        })
    } catch (err) {
        dispatch({ type: POST_ERROR });
        toast.error(err.response.data.message);
    }
  }

  const createPost = async (title, tag, description, image) => { 
    const config = { headers: {'Content-Type': 'application/json'} };
    const body = new FormData();
    body.append('title', title);
    body.append('tag', tag);
    body.append('description', description);
    body.append('image', image);
    try {
        const res = await axios.post('/api/post', body, config);
        toast.success(res.data.message);
        props.history.push(`/post/${res.data.post._id}`);
    } catch (err) {
        dispatch({ type: POST_ERROR });
        toast.error(err.response.data.message);
    }
  }

  const editPost = async (id, title, tag, description, blogimage) => { 
    const config = { headers: {'Content-Type': 'application/json'} };
    const body = new FormData();
    body.append('id', id);
    body.append('title', title);
    body.append('tag', tag);
    body.append('description', description);
    body.append('image', blogimage);
    try {
        const res = await axios.put(`/api/post/${id}`, body, config);        
        toast.success(res.data.message);
        props.history.push(`/post/${id}`);
    } catch (err) {
        dispatch({ type: POST_ERROR });
        toast.error(err.response.data.message);
    }
  }

  const deletePost = async (id) => { 
    try {
        await axios.delete(`/api/post/${id}`); 
        toast.success('Post has been deleted.');
        props.history.push('/');
    } catch (err) {
        dispatch({ type: POST_ERROR });
        toast.error(err.response.data.message);
    }
  }
  
  const createComment = async (id, comment) => {
    const config = { headers: {'Content-Type': 'application/json'} };
    try {
        const res = await axios.post(`/api/post/comment/${id}`, comment, config);
        toast.success(res.data.message);
        dispatch({
          type: CREATE_COMMENT,
          payload: res.data.comment
        })
    } catch (err) {
        dispatch({ type: POST_ERROR });
        toast.error(err.response.data.message);
    }
  }

  const deleteComment = async (postId, commentId) => {
    try {
        const res = await axios.delete(`/api/post/comment/${postId}/${commentId}`);
        toast.success(res.data.message);
        dispatch({
          type: DELETE_COMMENT,
          payload: commentId
        });
    } catch (err) {
        dispatch({ type: POST_ERROR });
        toast.error(err.response.data.message);
    }
  }

  const postIsLiked = (likes, loggedInUser) => {	
    if (likes && loggedInUser) {	
      // console.log('likes', likes);
        const isLiked = likes.filter(like => like.user === loggedInUser._id);	
        if (isLiked.length) {	
            return true;	
        }	
        return false;	
    }	
}	

  const likePost = async (id) => {	
      try {	
          const res = await axios.put(`/api/post/like/${id}`);  
          console.log('like', res.data.likes);	
          dispatch({ 
            type: UPDATE_LIKES, 
            payload: res.data.likes 
          });
          toast.success(res.data.message);	
      } catch (err) {	
          console.error(err);   	
          toast.error(err.response.data.message);	
      }	
  }	

  const unLikePost = async (id) => {	
      try {	
          const res = await axios.put(`/api/post/unlike/${id}`);  	
          console.log('dislike', res.data.likes);	
          dispatch({ 
            type: UPDATE_LIKES, 
            payload: res.data.likes 
          });
          toast.success(res.data.message);	
      } catch (err) {	
          console.error(err);   	
          toast.error(err.response.data.message);	
      } 	
  }

  const descriptionTrimmer = (desc) => {
    return desc.slice(0, 150) + '...';
  }

  return (
    <PostContext.Provider value={{
      posts: state.posts,
      post: state.post,
      comments: state.comments,
      postLoading: state.postLoading,
      getAllPosts,
      getPost,
      deletePost,
      createComment,
      deleteComment,
      descriptionTrimmer,
      editPost,
      createPost,
      postIsLiked,
      likePost,
      unLikePost
    }}>
      { props.children }
    </PostContext.Provider>
  )
}

export default withRouter(PostState);