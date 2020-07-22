import React, { Fragment, useContext, useEffect } from 'react';
import svg from '../../assets/images/icons/sprite.svg'
import PostContext from '../../context/postContext/PostContext';
import AuthContext from '../../context/authContext/AuthContext';
import placeholderUserImage from '../../assets/images/jade-hendricks.jpg';
import placeholderPostImage from '../../assets/images/seven-img1.png';

const FullPost = ({ match, history }) => {
    const { post, getPost, loading } = useContext(PostContext);
    const { user } = useContext(AuthContext);

    useEffect(() => {
        getPost(match.params.id);
    }, []);

    const isUsersPosts = () => {
        if (post && user) {
            if (post.user._id === user._id) {
                return true;
            }
        }
        return false;
    }
    
    return (
        <Fragment>
            <div className="post">
                <div className="post__banner">
                    { isUsersPosts() && (
                        <div className="author-options">
                            <button className="button button--yellow">Edit Post</button>
                            <button className="button button--red">Delete Post</button>
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
                            <img src={ placeholderPostImage } alt={ post && post.title } title={ post && post.title } />
                        </div>
                        <h1 className="post__title">{ post && post.title }</h1>
                    </div>
                    <div className="post__user">
                        <div className="post__user-block">
                            <img className="post__user-icon" src={ placeholderUserImage } alt={ post && post.user.name } title={ post && post.user.name } />
                            <span className="post__user-name">{ post && post.user.name }</span>
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
                    <p>{ post && post.description } <br /> { post && post.description }</p>
                    <p>{ post && post.description } <br /> { post && post.description }</p>
                    <p>{ post && post.description }</p>
                    <p>{ post && post.description } <br /> { post && post.description }</p>
                </div>
            </div>
        </div>
    </Fragment>
    )
}

export default FullPost;