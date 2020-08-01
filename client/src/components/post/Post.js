import React, { Fragment, useContext, useEffect, useState } from 'react';
import svg from '../../assets/images/icons/sprite.svg'
import axios from 'axios';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';
import AuthContext from '../../context/authContext/AuthContext';
import PostContext from '../../context/postContext/PostContext';
import CommentSubmit from '../comment/CommentSubmit';

const FullPost = ({ match, history }) => {
    const { loggedInUser, isUsersData } = useContext(AuthContext);
    const { deletePost } = useContext(PostContext);

    const [post, setPost] = useState({});
    const  { title, description, image, _id, user, comments } = post;

    const getPost = async (id) => {
        try {
            const res = await axios.get(`/api/post/${id}`);
            setPost(res.data.post);
        } catch (err) {
            console.error(err.response.data.message);
            toast.error(err.response.data.message);
        }
    }

    useEffect(() => {
        getPost(match.params.id);
    }, [match.params.id, loggedInUser]);

    return (
        <div className="post">
            <div className="post__banner">
                    <div className="author-options">
                        { user && loggedInUser && isUsersData(loggedInUser._id, user._id) && (
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
                            { image && (
                                <img src={require(`../../assets/images/posts/${image}`)} alt={ title } title={ title } />
                            ) }
                        </div>
                        <h1 className="post__title">{ title }</h1>
                    </div>
                    <div className="post__user">
                        <div className="post__user-block">
                            { user && user.avatar && (
                                <img className="form__user-photo" src={require(`../../assets/images/users/${user.avatar}`)} alt={ user && user.name } title={ user && user.name } />
                            )}
                            <span className="post__user-name">{ user && user.name }</span>
                        </div>
                        { user && user.socials && (
                            <div className="post__user-social">
                                { user.socials.facebook && (
                                    <a href={user.socials.facebook} target='_blank' rel='noopener noreferrer'>
                                        <svg className="post__user-social-icon">
                                            <use xlinkHref={`${svg}#icon-facebook-square`}></use>
                                        </svg>  
                                    </a>
                                ) }
                                { user.socials.linkedin && (
                                    <a href={user.socials.linkedin} target='_blank' rel='noopener noreferrer'>
                                        <svg className="post__user-social-icon">
                                            <use xlinkHref={`${svg}#icon-linkedin-square`}></use>
                                        </svg>  
                                    </a>
                                ) }
                                { user.socials.twitter && (
                                    <a href={user.socials.twitter} target='_blank' rel='noopener noreferrer'>
                                        <svg className="post__user-social-icon">
                                            <use xlinkHref={`${svg}#icon-twitter-square`}></use>
                                        </svg>  
                                    </a>
                                ) }                                  
                            </div>
                        ) }
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