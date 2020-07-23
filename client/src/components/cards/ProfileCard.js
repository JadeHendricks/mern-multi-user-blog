import React, { useContext } from 'react';
import svg from '../../assets/images/icons/sprite.svg'
import placeholderPostImage from '../../assets/images/seven-img1.png';
import { Link } from 'react-router-dom';
import PostContext from '../../context/postContext/PostContext';

const ProfileCard = ({ post: { _id, title, tag, description } }) => {

    const { deletePost } = useContext(PostContext);

    const descriptionTrimmer = (desc) => {
        return desc.slice(0, 150) + '...';
    }

    return (
        <div className="card">
            <Link to={`/post/${_id}`}>
            <div className="card__header">
                <img className="card__image" src={ placeholderPostImage } alt={ title && title } title={ title && title } />
                <h5 className="card__tag">{ tag && tag }</h5>
            </div>
            </Link>
            <div className="card__details">
                <Link to={`/post/${_id}`} className="card__title">{ title && title }</Link>
                <p className="card__description">
                    { descriptionTrimmer(description) }
                </p>
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
            <div className="card__user">
                <div className="card__user-options">
                    <Link to={`/create-post`} className="button button--yellow">Edit post</Link>
                    <Link onClick={ () => deletePost(_id) } className="button button--red">Delete post</Link>
                </div>
            </div>
        </div>
    )
}

export default ProfileCard;