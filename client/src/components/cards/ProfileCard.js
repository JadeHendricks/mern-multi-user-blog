import React from 'react';
import svg from '../../assets/images/icons/sprite.svg'

const ProfileCard = () => {
    return (
        <div className="card">
            <div className="card__header">
                <img className="card__image" src="https://via.placeholder.com/200" alt="BlogTitle" title="BlogTitle" />
                <h5 className="card__tag">ipsum dolor</h5>
            </div>
            <div className="card__details">
                <h4 className="card__title">Consectetur amet adipisicing.</h4>
                <p className="card__description">
                    Lorem ipsum dolor sit amet consectetur adipisicing elit. 
                    Quisquam sunt minus voluptatem ex minima sed vitae, praesentium
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
                    <a href="#" className="button button--yellow">Edit post</a>
                    <a href="#" className="button button--red">Delete post</a>
                </div>
            </div>
        </div>
    )
}

export default ProfileCard;