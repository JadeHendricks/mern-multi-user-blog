import React from 'react';
import Moment from 'react-moment';
import svg from '../../assets/images/icons/sprite.svg'
import { Link } from 'react-router-dom';
import placeholderUserImage from '../../assets/images/jade-hendricks.jpg';

const UserCard = ({ user: { createdAt, name, _id } }) => {
    return (
        <div className="card-user">
            <div className="card-user__header">
                <Link to={`/profile/${_id}`} className="card-user__image">
                    <img src={ placeholderUserImage } alt={ name } title={ name } />
                </Link>
                <div className="card-user__userInfo">
                    <Link to={`/profile/${_id}`} className="card-user__title">{ name }</Link>
                    <p className="card-user__date">Joined date: <Moment format="DD/MM/YYYY">{ createdAt }</Moment></p>
                    <Link to={`/profile/${_id}`} className="button button--yellow">Visit Profile</Link>
                </div>
            </div>
            <div className="card-user__footer">
                <div className="card-user__social">    
                    <svg className="card-user__social-icon">
                        <use xlinkHref={`${svg}#icon-facebook-square`}></use>
                    </svg>       
                    <svg className="card-user__social-icon">
                        <use xlinkHref={`${svg}#icon-linkedin-square`}></use>
                    </svg>       
                    <svg className="card-user__social-icon">
                        <use xlinkHref={`${svg}#icon-twitter-square`}></use>
                    </svg>                            
                </div>
            </div>
        </div>
    )
}

export default UserCard;
