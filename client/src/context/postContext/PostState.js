import React from "react";
import PostContext from './PostContext';
import { toast } from 'react-toastify';
import { withRouter } from 'react-router-dom';
import axios from 'axios';

const PostState = props => {

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
        console.error(err);
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
        console.error(err);
        toast.error(err.response.data.message);
    }
  }

  const deletePost = async (id) => { 
    try {
        await axios.delete(`/api/post/${id}`); 
        toast.success('Post has been deleted.');
    } catch (err) {
        console.log(err);
        toast.error(err.response.data.message);
    }
  }
  
  const createComment = async (id, comment) => {
    const config = { headers: {'Content-Type': 'application/json'} };
    try {
        const res = await axios.post(`/api/post/comment/${id}`, comment, config);
        toast.success(res.data.message);
    } catch (err) {
        console.error(err);
        toast.error(err.response.data.message);
    }
  }

  const deleteComment = async (postId, commentId) => {
    try {
        const res = await axios.delete(`/api/post/comment/${postId}/${commentId}`);
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
      deletePost,
      createComment,
      deleteComment,
      descriptionTrimmer,
      editPost,
      createPost
    }}>
      { props.children }
    </PostContext.Provider>
  )
}

export default withRouter(PostState);