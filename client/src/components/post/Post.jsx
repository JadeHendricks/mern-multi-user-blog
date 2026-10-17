import React, { Fragment, useContext } from 'react';
import svg from '../../assets/images/icons/sprite.svg'
import { Link, useNavigate, useParams } from 'react-router';
import AuthContext from '../../context/authContext/AuthContext';
import CommentSubmit from '../comment/CommentSubmit';
import ContentLoader from '../layouts/ContentLoader';
import { isHttpsUrl } from '../../utils/safeUrl';
import { uploadUrl, onImageError } from '../../utils/imageUrl';
import { postIsLiked } from '../../utils/postUtils';
import { usePost } from '../../hooks/usePost';
import { useToggleLike } from '../../hooks/useToggleLike';
import { useDeletePost } from '../../hooks/useDeletePost';

// A post that has not arrived (or failed to load) renders the empty frame, as before.
const NO_POST = {};

const FullPost = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { loggedInUser, isUsersData, authLoading } = useContext(AuthContext);
    const { data, isPending: postLoading } = usePost(id);
    const post = data ?? NO_POST;
    const toggleLike = useToggleLike();
    const deletePost = useDeletePost();
    const  { title, description, image, _id, user, likes, comments } = post;

    // useDeletePost only leaves the page once the server confirmed the delete.
    const handleDelete = () => {
        if (!window.confirm('Delete this post? This cannot be undone.')) {
            return;
        }
        deletePost.mutate(_id);
    };
    return (
        <Fragment>
            { authLoading && postLoading ? (<ContentLoader />) : (
                <div className="post">
                    <div className="post__banner">
                        <div className="author-options">
                            { post._id && (
                                <Fragment>
                                    <button className="button button--white" onClick={ () => navigate(-1) }>Go back</button>
                                    { postIsLiked(likes, loggedInUser) ? 	
                                        <button className="button button--red" onClick={ () => toggleLike(_id, true) }>Unlike Post</button> :	
                                        <button className="button" onClick={ () => toggleLike(_id, false) }>Like Post</button>	
                                    }
                                    { loggedInUser && isUsersData(loggedInUser._id, user._id) && (
                                        <Fragment>
                                            <Link to={`/edit-post/${_id}`} className="button button--yellow">Edit Post</Link>
                                            <button className="button button--red" onClick={ handleDelete }>Delete Post</button>
                                        </Fragment>
                                    )}
                                </Fragment>
                            )}
                        </div>
                    </div>
                    <div className="container">
                        <div className="post__container">
                            <div className="post__header">
                                <div className="post__top">
                                    <div className="post__image-block">
                                        <img src={ uploadUrl('posts', image) } onError={ onImageError('posts') } alt={ title } title={ title } />
                                    </div>
                                    <h1 className="post__title">{ title }</h1>
                                </div>
                                <div className="post__user">
                                    <div className="post__user-block">
                                        <img className="form__user-photo" src={ uploadUrl('users', user?.avatar) } onError={ onImageError('users') } alt={ user?.name } title={ user?.name } />
                                        <span className="post__user-name">{ user?.name }</span>
                                    </div>
                                    { user?.socials && (
                                        <div className="post__user-social">
                                            { isHttpsUrl(user.socials.facebook) && (
                                                <a href={user.socials.facebook} target='_blank' rel='noopener noreferrer'>
                                                    <svg className="post__user-social-icon">
                                                        <use xlinkHref={`${svg}#icon-facebook-square`}></use>
                                                    </svg>  
                                                </a>
                                            ) }
                                            { isHttpsUrl(user.socials.linkedin) && (
                                                <a href={user.socials.linkedin} target='_blank' rel='noopener noreferrer'>
                                                    <svg className="post__user-social-icon">
                                                        <use xlinkHref={`${svg}#icon-linkedin-square`}></use>
                                                    </svg>  
                                                </a>
                                            ) }
                                            { isHttpsUrl(user.socials.twitter) && (
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
                                <p>{ description }</p>
                            </div>
                            <CommentSubmit postId={_id} comments={ comments } />
                        </div>
                    </div>
                </div> 
            )}
        </Fragment>
    )
}

export default FullPost;