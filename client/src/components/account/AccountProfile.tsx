import { Fragment, useState } from 'react';
import type { MouseEvent } from 'react';
import type { PublicUserDto } from '@mern-blog/shared';
import svg from '../../assets/images/icons/sprite.svg'
import { useParams } from 'react-router';
import ProfileCard from '../cards/ProfileCard';
import PostCard from '../cards/PostCard';
import AccountSettings from './AccountSettings';
import { useAuth } from '../../context/authContext/AuthContext';
import ContentLoader from '../layouts/ContentLoader';
import { isHttpsUrl } from '../../utils/safeUrl';
import { avatarAlt } from '../../utils/a11y';
import { uploadUrl, onImageError } from '../../utils/imageUrl';
import { useUserPosts } from '../../hooks/useUserPosts';
import { useUser } from '../../hooks/useUser';

// A profile that has not arrived (or failed to load) renders the empty frame, as before.
const NO_USER: Partial<PublicUserDto> = {};

const Profile = () => {
    // The route always has :id; the empty default only satisfies the types.
    const { id = '' } = useParams();
    const { loggedInUser, isUsersData, authLoading } = useAuth();
    const { data, isPending: userLoading } = useUser(id);
    const user = data ?? NO_USER;
    // Posts come from Query so a like on a card here updates the count shown on it.
    const { data: userPosts = [] } = useUserPosts(id);

    const [ navigationState, setNavigationState ] = useState('all-posts');
    const handleNavigationState = (e: MouseEvent<HTMLButtonElement>) => { setNavigationState(e.currentTarget.name); };

    return (
        <Fragment>
            { authLoading && userLoading ?  (<ContentLoader />) : (
                <Fragment>
                    <div className="post">
                        <div className="post__banner post__banner--account">
                            <div className="container">
                                <div className="user-header">
                                    <div className="user-header__image">
                                        <img className="avatar user-header__avatar" src={ uploadUrl('users', user.avatar) } onError={ onImageError('users') } alt={ avatarAlt(user.name) } title={ user.name } />
                                    </div>
                                    <div className="user-header__info">
                                        <h3 className="user-header__info-name">{ user.name }</h3>
                                        <p className="user-header__info-description">
                                            Lorem ipsum dolor sit amet consectetur adipisicing elit. 
                                            Corporis iusto quasi, quidem molestias aperiam in earum deleniti amet incidunt possimus.
                                        </p>
                                        <div className="user-header__socials">    
                                            { user.socials && (
                                                <div className="user-header__socials">    
                                                    { isHttpsUrl(user.socials.facebook) && (
                                                        <a href={user.socials.facebook} aria-label="Facebook profile" target='_blank' rel='noopener noreferrer'>
                                                            <svg className="user-header__socials-icon" aria-hidden="true" focusable="false">
                                                                <use xlinkHref={`${svg}#icon-facebook-square`}></use>
                                                            </svg>  
                                                        </a>
                                                    )}
                                                    { isHttpsUrl(user.socials.linkedin) && (
                                                        <a href={user.socials.linkedin} aria-label="LinkedIn profile" target='_blank' rel='noopener noreferrer'>
                                                            <svg className="user-header__socials-icon" aria-hidden="true" focusable="false">
                                                                <use xlinkHref={`${svg}#icon-linkedin-square`}></use>
                                                            </svg>
                                                        </a>
                                                    )}
                                                    { isHttpsUrl(user.socials.twitter) && (
                                                        <a href={user.socials.twitter} aria-label="Twitter profile" target='_blank' rel='noopener noreferrer'>
                                                            <svg className="user-header__socials-icon" aria-hidden="true" focusable="false">
                                                                <use xlinkHref={`${svg}#icon-twitter-square`}></use>
                                                            </svg>  
                                                        </a>  
                                                    )}                                                    
                                                </div>  
                                            )}                                         
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="container">
                        <div className="account">
                            <aside className="account__options">
                                <nav>
                                    <ul className="account-nav__ul">
                                        <li className="account-nav__el"><button className="account-nav__button" onClick={ handleNavigationState } name='all-posts'>All posts ({ userPosts.length })</button></li>
                                        { isUsersData(loggedInUser?._id, user._id) && <li className="account-nav__el"><button className="account-nav__button" onClick={ handleNavigationState } name='account-settings'>Account settings</button></li> }
                                    </ul>
                                </nav>
                            </aside>
                            <main className="account__view">
                                <h2 className="account__view-title">
                                    {  navigationState === 'all-posts' ? 'All Posts' : 'Account Settings' }
                                </h2>
                                { navigationState === 'all-posts' ? (
                                    <section>
                                        <div className="cards">
                                            { isUsersData(loggedInUser?._id, user._id) && userPosts.map(post => <ProfileCard key={post._id} post={ post } variant="account" />) }
                                            { !isUsersData(loggedInUser?._id, user._id) && userPosts.map(post => <PostCard key={post._id} post={ post } variant="account" />) }
                                        </div>
                                    </section>
                                ) : <AccountSettings key={ user._id } user={ user } email={ loggedInUser?.email }/> }
                            </main>
                        </div>
                    </div>
                </Fragment>
            )}
        </Fragment>
    )
}

export default Profile;
