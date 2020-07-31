import React from 'react';
import Moment from 'react-moment';
import svg from '../../assets/images/icons/sprite.svg'
import { Link } from 'react-router-dom';

const UserCard = ({ user: { createdAt, name, _id, avatar, socials } }) => {
    return (
        <div className="card-user">
            <div className="card-user__header">
                <Link to={`/profile/${_id}`} className="card-user__image">
                    { avatar && (
                        <img src={require(`../../assets/images/users/${avatar}`)} alt={ name } title={ name } />
                    ) }

                </Link>
                <div className="card-user__userInfo">
                    <Link to={`/profile/${_id}`} className="card-user__title">{ name }</Link>
                    <p className="card-user__date">Joined date: <Moment format="DD/MM/YYYY">{ createdAt }</Moment></p>
                    <Link to={`/profile/${_id}`} className="button button--yellow">Visit Profile</Link>
                </div>
            </div>
            <div className="card-user__footer">
                { socials  && (
                    <div className="card-user__social"> 
                        { socials.facebook && (
                            <a href={ socials.facebook } target='_blank' rel='noopener noreferrer'>
                                <svg className="card-user__social-icon">
                                    <use xlinkHref={`${svg}#icon-facebook-square`}></use>
                                </svg>  
                            </a>  
                        ) }   
                        { socials.linkedin && (
                            <a href={ socials.linkedin } target='_blank' rel='noopener noreferrer'>
                                <svg className="card-user__social-icon">
                                    <use xlinkHref={`${svg}#icon-linkedin-square`}></use>
                                </svg>  
                            </a>     
                        ) }
                        { socials.twitter && (
                            <a href={ socials.twitter } target='_blank' rel='noopener noreferrer'>
                                <svg className="card-user__social-icon">
                                    <use xlinkHref={`${svg}#icon-twitter-square`}></use>
                                </svg>  
                            </a>
                        ) }                          
                    </div>
                ) }
            </div>
        </div>
    )
}

export default UserCard;
