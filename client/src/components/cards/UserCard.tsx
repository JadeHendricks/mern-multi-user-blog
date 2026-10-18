import type { PublicUserDto } from '@mern-blog/shared';
import { formatDate } from '../../lib/formatDate';
import svg from '../../assets/images/icons/sprite.svg'
import { Link } from 'react-router';
import { isHttpsUrl } from '../../utils/safeUrl';
import { uploadUrl, onImageError } from '../../utils/imageUrl';
import { avatarAlt } from '../../utils/a11y';

interface UserCardProps {
    user: PublicUserDto;
}

const UserCard = ({ user: { createdAt, name, _id, avatar, socials } }: UserCardProps) => {
    return (
        <div className="card-user">
            <div className="card-user__header">
                <Link to={`/profile/${_id}`} className="card-user__image">
                    <img className="avatar card-user__avatar" src={ uploadUrl('users', avatar) } onError={ onImageError('users') } alt={ avatarAlt(name) } title={ name } />
                </Link>
                <div className="card-user__info">
                    <Link to={`/profile/${_id}`} className="card-user__title">{ name }</Link>
                    <p className="card-user__date">Joined date: { formatDate(createdAt) }</p>
                    <Link to={`/profile/${_id}`} className="button button--yellow">Visit Profile</Link>
                </div>
            </div>
            <div className="card-user__footer">
                <div>
                    { isHttpsUrl(socials?.facebook) && (
                        <a href={ socials.facebook } aria-label="Facebook profile" target='_blank' rel='noopener noreferrer'>
                            <svg className="card-user__social-icon" aria-hidden="true" focusable="false">
                                <use xlinkHref={`${svg}#icon-facebook-square`}></use>
                            </svg>  
                        </a>  
                    ) }   
                    { isHttpsUrl(socials?.linkedin) && (
                        <a href={ socials.linkedin } aria-label="LinkedIn profile" target='_blank' rel='noopener noreferrer'>
                            <svg className="card-user__social-icon" aria-hidden="true" focusable="false">
                                <use xlinkHref={`${svg}#icon-linkedin-square`}></use>
                            </svg>  
                        </a>     
                    ) }
                    { isHttpsUrl(socials?.twitter) && (
                        <a href={ socials.twitter } aria-label="Twitter profile" target='_blank' rel='noopener noreferrer'>
                            <svg className="card-user__social-icon" aria-hidden="true" focusable="false">
                                <use xlinkHref={`${svg}#icon-twitter-square`}></use>
                            </svg>  
                        </a>
                    ) }                          
                </div>
            </div>
        </div>
    )
}

export default UserCard;
