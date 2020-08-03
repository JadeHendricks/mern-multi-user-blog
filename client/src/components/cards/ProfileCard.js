import React, { useContext } from 'react';
import svg from '../../assets/images/icons/sprite.svg';
import AuthContext from '../../context/authContext/AuthContext';
import PostContext from '../../context/postContext/PostContext';
import { Link } from 'react-router-dom';

const ProfileCard = ({ post: { _id, title, image, tag, description, comments, likes } }) => {
    const { loggedInUser } = useContext(AuthContext);	
    const { deletePost, likePost, unLikePost, postIsLiked, descriptionTrimmer } = useContext(PostContext);

    return (
        <div className="card">
            <Link to={`/post/${_id}`}>
            <div className="card__header">
                <img className="card__image" src={require(`../../assets/images/posts/${image}`)} alt={ title } title={ title } />
                <h5 className={ tag === 'travel' ? 'card__tag card__tag--orange': tag === 'funny' ? 'card__tag card__tag--yellow': 'card__tag'}>
                    { tag }
                </h5>
            </div>
            </Link>
            <div className="card__details">
                <Link to={`/post/${_id}`} className="card__title">{ title }</Link>
                <p className="card__description">
                    { descriptionTrimmer(description) }
                </p>
                <div className="card__interaction">
                    <div className="card__interaction-block">
                        <svg className="card__interaction-icon card__interaction-icon-comment">
                            <use xlinkHref={`${svg}#icon-comment-o`}></use>
                        </svg>   
                        <span>{ comments.length } { comments.length === 1 ? 'Comment' : 'Comments' }</span>
                    </div>
                    <div className="card__interaction-block">	
                        { !postIsLiked(likes, loggedInUser) ? (	
                            <svg className="card__interaction-icon" onClick={ () => likePost(_id) }>	
                                <use xlinkHref={`${svg}#icon-heart-o`}></use>	
                            </svg>	
                        ) : (	
                            <svg className="card__interaction-icon" onClick={ () => unLikePost(_id) }>	
                                <use xlinkHref={`${svg}#icon-heart`}></use>	
                            </svg>	
                        ) }  	
                        <span>{ likes.length } { likes.length === 1 ? 'Like' : 'Likes' }</span>	
                    </div>
                </div>
            </div>
            <div className="card__user">
                <div className="card__user-options">
                    <Link to={`/edit-post/${_id}`} className="button button--yellow">Edit post</Link>
                    <Link to='/' onClick={ () => deletePost(_id) } className="button button--red">Delete post</Link>
                </div>
            </div>
        </div>
    )
}

export default ProfileCard;