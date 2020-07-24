import React, { Fragment, useContext, useEffect } from 'react';
import svg from '../../assets/images/icons/sprite.svg'
import Loader from '../layouts/Loader';
import PostContext from '../../context/postContext/PostContext';
import AuthContext from '../../context/authContext/AuthContext';
import placeholderUserImage from '../../assets/images/jade-hendricks.jpg';
import placeholderPostImage from '../../assets/images/seven-img1.png';

const FullPost = ({ match, history }) => {
    const { post, getPost, deletePost } = useContext(PostContext);
    const { loggedInUser } = useContext(AuthContext);

    useEffect(() => {
        getPost(match.params.id);
    }, []);

    return (
        <Fragment>
            { !loggedInUser || !post || !post.user ? <Loader /> : (
                <div className="post">
                    <div className="post__banner">
                        { post.user._id === loggedInUser._id && (
                            <div className="author-options">
                                <button className="button button--yellow">Edit Post</button>
                                <button className="button button--red" onClick={ () => deletePost(post._id) }>Delete Post</button>
                            </div>
                        ) }
                        <div className="back-button">
                            <button className="button button--white" onClick={ () => history.goBack() }>Go back</button>
                        </div>
                    </div>
                    <div className="post__container">
                        <div className="post__header">
                        <div className="post__top">
                            <div className="post__image-block">
                                <img src={ placeholderPostImage } alt={ post.title } title={ post.title } />
                            </div>
                            <h1 className="post__title">{ post.title }</h1>
                        </div>
                        <div className="post__user">
                            <div className="post__user-block">
                                <img className="post__user-icon" src={ placeholderUserImage } alt={ post.user.name } title={ post.user.name } />
                                <span className="post__user-name">{ post.user.name }</span>
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
                        <p>{ post.description } <br /> { post.description }</p>
                        <p>{ post.description } <br /> { post.description }</p>
                    </div>
                </div>
            </div>  
            ) }
        </Fragment>
    )
}

export default FullPost;