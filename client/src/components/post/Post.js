import React, { Fragment, useContext, useEffect, useState } from 'react';
import svg from '../../assets/images/icons/sprite.svg'
import axios from 'axios';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';
import Loader from '../layouts/Loader';
import AuthContext from '../../context/authContext/AuthContext';
import CommentSubmit from '../comment/CommentSubmit';
import placeholderUserImage from '../../assets/images/jade-hendricks.jpg';
import placeholderPostImage from '../../assets/images/seven-img1.png';

const FullPost = ({ match, history }) => {
    const { loggedInUser } = useContext(AuthContext);

    const [post, setPost] = useState({});
    const  { title, description, _id, user, likes, comments } = post;

    const getPost = async (id) => {
        try {
            const res = await axios.get(`/api/post/${id}`);
            setPost(res.data.post);
        } catch (err) {
            console.log(err.response.message);
        }
    }

    const deletePost = async (id) => { 
        try {
            await axios.delete(`/api/post/${id}`); 
            toast.success('Post has been deleted');
        } catch (err) {
            console.log(err.response.message);
        }
    }

    const likePost = async (id) => {
        try {
            await axios.put(`/api/post/like/${id}`);  
        } catch (err) {
            console.log(err.response.message);   
        }
    }

    const unLikePost = async (id) => {
        try {
            await axios.put(`/api/post/unlike/${id}`);  
        } catch (err) {
            console.log(err.response.message);  
        } 
    }

    const isUsersData = () => {
        if (loggedInUser && user) {
            return loggedInUser._id === user._id;
        }
    }

    const postIsLiked = () => {
        if (likes && loggedInUser) {
            const isLiked = likes.filter(like => like.user === loggedInUser._id);
            if (isLiked.length > 0) {
                return true;
            }
            return false;
        }
    }

    useEffect(() => {
        getPost(match.params.id);
    }, [match.params.id, loggedInUser]);

    return (
        <div className="post">
            <div className="post__banner">
                    <div className="author-options">
                        { postIsLiked() ? 
                            <button className="button" onClick={ () => unLikePost(_id) }>Unlike Post</button> :
                            <button className="button" onClick={ () => likePost(_id) }>Like Post</button>
                        }
                        { isUsersData() && (
                            <Fragment>
                                <Link to={`/edit-post/${_id}`} className="button button--yellow">Edit Post</Link>
                                <button className="button button--red" onClick={ () => deletePost(_id) }>Delete Post</button>
                            </Fragment>
                        )}
                    </div>
                <div className="back-button">
                    <button className="button button--white" onClick={ () => history.goBack() }>Go back</button>
                </div>
            </div>
            <div className="post__container">
                <div className="post__header">
                    <div className="post__top">
                        <div className="post__image-block">
                            <img src={ placeholderPostImage } alt={ title } title={ title } />
                        </div>
                        <h1 className="post__title">{ title }</h1>
                    </div>
                    <div className="post__user">
                        <div className="post__user-block">
                            <img className="post__user-icon" src={ placeholderUserImage } alt={ user && user.name } title={ user && user.name } />
                            <span className="post__user-name">{ user && user.name }</span>
                        </div>
                        <div className="post__user-social">
                            <svg className="post__user-social-icon">
                                <use xlinkHref={`${svg}#icon-facebook-square`}></use>
                            </svg>  
                            <svg className="post__user-social-icon">
                                <use xlinkHref={`${svg}#icon-linkedin-square`}></use>
                            </svg>                                   
                            <svg className="post__user-social-icon">
                                <use xlinkHref={`${svg}#icon-twitter-square`}></use>
                            </svg>                                   
                        </div>
                    </div>
                </div>
                <div className="post__body">
                    <p>{ description } <br /> { description }</p>
                    <p>{ description } <br /> { description }</p>
                </div>
                <CommentSubmit postId={_id} comments={ comments } />
            </div>
        </div> 
    )
}

export default FullPost;