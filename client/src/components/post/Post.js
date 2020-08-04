import React, { Fragment, useContext, useEffect } from 'react';
import svg from '../../assets/images/icons/sprite.svg'
import { Link } from 'react-router-dom';
import AuthContext from '../../context/authContext/AuthContext';
import PostContext from '../../context/postContext/PostContext';
import CommentSubmit from '../comment/CommentSubmit';

const FullPost = ({ match, history }) => {
    const { loggedInUser, isUsersData, authLoading } = useContext(AuthContext);
    const { deletePost, likePost, unLikePost, postIsLiked, getPost, post, postLoading } = useContext(PostContext);
    const  { title, description, image, _id, user, likes, comments } = post;

    useEffect(() => {
        getPost(match.params.id);
        console.log('authLoading', authLoading);
        console.log('postLoading', postLoading);
    }, [match.params.id]);

    return (
        <Fragment>
            { authLoading && postLoading ? (<h1>Loading</h1>) : (
                <div className="post">
                    <div className="post__banner">
                        <div className="author-options">
                            { _id && postIsLiked(likes, loggedInUser) ? 	
                                <button className="button" onClick={ () => unLikePost(_id) }>Unlike Post</button> :	
                                <button className="button" onClick={ () => likePost(_id) }>Like Post</button>	
                            }
                            { loggedInUser && isUsersData(loggedInUser._id, user._id) && (
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
                                    { image && ( <img src={require(`../../assets/images/posts/${image}`)} alt={ title } title={ title } /> )}
                                </div>
                                <h1 className="post__title">{ title }</h1>
                            </div>
                            <div className="post__user">
                                <div className="post__user-block">
                                    { user.avatar && ( <img className="form__user-photo" src={require(`../../assets/images/users/${user.avatar}`)} alt={ user.name } title={ user.name } /> )}
                                    <span className="post__user-name">{ user.name }</span>
                                </div>
                                { user.socials && (
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
            )}
        </Fragment>
    )
}

export default FullPost;