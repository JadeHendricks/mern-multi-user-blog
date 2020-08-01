import React from "react";
import PostContext from './PostContext';
import { toast } from 'react-toastify';
import { withRouter } from 'react-router-dom';
import axios from 'axios';

const PostState = props => {
  const deletePost = async (id) => { 
    try {
        await axios.delete(`/api/post/${id}`); 
        toast.success('Post has been deleted');
    } catch (err) {
        console.log(err.response.data.message);
        toast.success('Comment added');
    }
}
  
  const createComment = (id, comment) => {
    const config = { headers: {'Content-Type': 'application/json'} };
    const body = JSON.stringify(comment);
    try {
        axios.post(`/api/post/comment/${id}`, body, config);
        toast.success('Comment added');
    } catch (err) {
        console.log(err.response.message);
    }
}

  const deleteComment = async (postId, commentId) => {
    try {
        await axios.delete(`/api/post/comment/${postId}/${commentId}`);
        toast.success('Comment deleted')
    } catch (err) {
        console.log(err.reponse.message)
    }
  }

  const postIsLiked = (likes, loggedInUser) => {
    if (likes && loggedInUser) {
        const isLiked = likes.filter(like => like.user === loggedInUser._id);
        if (isLiked.length > 0) {
            return true;
        }
        return false;
    }
}

  const likePost = async (id) => {
      try {
          const res = await axios.put(`/api/post/like/${id}`);  
          toast.success(res.data.message);
      } catch (err) {
          console.error(err.response.data.message);   
          toast.error(err.response.data.message);
      }
  }

  const unLikePost = async (id) => {
      try {
          const res = await axios.put(`/api/post/unlike/${id}`);  
          toast.success(res.data.message);
      } catch (err) {
          console.error(err.response.data.message);   
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
      postIsLiked,
      likePost,
      unLikePost,
      descriptionTrimmer
    }}>
      { props.children }
    </PostContext.Provider>
  )
}

export default withRouter(PostState);