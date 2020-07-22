import React, { useReducer } from "react";
import PostContext from './PostContext';
import PostReducer from './PostReducer';
import { toast } from 'react-toastify';
import { withRouter } from 'react-router-dom';
import axios from 'axios';
import { GET_ALL_POSTS, GET_POST, CREATE_POST, DELETE_POST, EDIT_POST, CLEAR_POST, POST_ERROR  } from '../types';

const PostState = props => {

    const initialState = {
        posts: [],
        post: null,
        loading: true,
        error: null
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
            dispatch({
                type: POST_ERROR,
                payload: err.response.message
            });
        }
    }

    const getPost = async (id) => {
        try {
            const res = await axios.get(`/api/post/${id}`);
            dispatch({ 
                type: GET_POST, 
                payload: res.data.post
            });
        } catch (err) {
            dispatch({
                type: POST_ERROR,
                payload: err.response.message
            });
        }
    }

    const createPost = async (title, tag, description) => { 
        const config = { headers: {'Content-Type': 'application/json'} };
        const body = JSON.stringify({ title, tag, description });
        try {
            const res = await axios.post('/api/post', body, config);
            dispatch({
                type: CREATE_POST,
                payload: res.data.post
            });
            toast.success(res.data.message);
        } catch (err) {
            dispatch({
                type: POST_ERROR,
                payload: err.response.message
            });
        }
    }

    const deletePost = async (id) => { 
        try {
            await axios.delete(`/api/post/${id}`); 
            dispatch({ 
                type: DELETE_POST, 
                payload: id 
            });
            toast.success('Post has been deleted');
        } catch (err) {
            dispatch({
                type: POST_ERROR,
                payload: err.response.message
            });
        }
    }

    const editPost = async () => { console.log('edit-post') }

    return (
        <PostContext.Provider value={{
            posts: state.posts,
            post: state.post,
            loading: state.loading,
            error: state.error,
            getAllPosts,
            getPost,
            createPost,
            editPost,
            deletePost
        }}>
          { props.children }
        </PostContext.Provider>
      )
}

export default withRouter(PostState);