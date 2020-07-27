import React, { useEffect, useContext } from 'react';
import axios from 'axios';
import svg from '../../assets/images/icons/sprite.svg'
import Moment from 'react-moment';
import { Link } from 'react-router-dom';
import placeholderUserImage from '../../assets/images/jade-hendricks.jpg';
import placeholderPostImage from '../../assets/images/seven-img1.png';
import AuthContext from '../../context/authContext/AuthContext';

const PostCard = ({ post: { _id, title, date, tag, description, user, likes, comments } }) => {

    const descriptionTrimmer = (desc) => {
        return desc.slice(0, 150) + '...';
    }

    const { loggedInUser } = useContext(AuthContext);

    const postIsLiked = () => {
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

    return (
        <div className="card">
            <Link to={`/post/${_id}`}>
                <div className="card__header">
                    <img className="card__image" src={ placeholderPostImage } alt={ title } title={ title } />
                    <h5 className="card__tag">{ tag }</h5>
                </div>
            </Link>
            <div className="card__details">
                <Link to={`/post/${_id}`} className="card__title">{ title }</Link>
                <p className="card__description">{ descriptionTrimmer(description) }</p>
                <div className="card__interaction">
                    <div className="card__interaction-block">
                        <svg className="card__interaction-icon">
                            <use xlinkHref={`${svg}#icon-comment-o`}></use>
                        </svg>
                        <span>{ comments.length } { comments.length === 1 ? 'Comment' : 'Comments' }</span>
                    </div>
                    <div className="card__interaction-block">
                        { !postIsLiked() ? (
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
            <Link to={`/profile/${user._id}`} className="card__user-link">
                <div className="card__user">
                    <img className="card__user-image" src={ placeholderUserImage } alt={ user.name } title={ user.name } />
                    <div className="card__user-info">
                        <div>{ user.name }</div>
                        <div>Posted on: <Moment format="DD/MM/YYYY">{ date }</Moment></div>
                    </div>
                </div>
            </Link>
        </div>
    )
}

export default PostCard;
