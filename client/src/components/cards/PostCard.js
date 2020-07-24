import React, { useEffect } from 'react';
import svg from '../../assets/images/icons/sprite.svg'
import Moment from 'react-moment';
import { Link } from 'react-router-dom';
import placeholderUserImage from '../../assets/images/jade-hendricks.jpg';
import placeholderPostImage from '../../assets/images/seven-img1.png';

const PostCard = ({ post: { _id, title, date, tag, description, user } }) => {

    const descriptionTrimmer = (desc) => {
        return desc.slice(0, 150) + '...';
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
                    <span>11 comments</span>
                    </div>
                    <div className="card__interaction-block">
                        <svg className="card__interaction-icon">
                            <use xlinkHref={`${svg}#icon-heart-o`}></use>
                        </svg>
                        <span>20 likes</span>
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
