import React, { Fragment, useEffect, useState, useContext } from 'react';
import svg from '../../assets/images/icons/sprite.svg'
import ProfileCard from '../cards/ProfileCard';
import PostCard from '../cards/PostCard';
import AccountSettings from './AccountSettings';
import AuthContext from '../../context/authContext/AuthContext';
import UserContext from '../../context/userContext/UserContext';
import ContentLoader from '../layouts/ContentLoader';

const Profile = ({ match }) => {
    const { loggedInUser, isUsersData, authLoading } = useContext(AuthContext);
    const { getAllUsersPosts, getUser, user, userPosts, userLoading } = useContext(UserContext);

    const [ navigationState, setNavigationState ] = useState('all-posts');
    const handleNavigationState = e => setNavigationState(e.target.name);

    useEffect(() => {
        getUser(match.params.id);
        getAllUsersPosts(match.params.id);
    }, [match.params.id, loggedInUser]);

    return (
        <Fragment>
            { authLoading && userLoading ?  (<ContentLoader />) : (
                <Fragment>
                    <div className="post">
                        <div className="post__banner post__banner--account">
                            <div className="container">
                                <div className="user-header">
                                    <div className="user-header__image">
                                        { user && user.avatar && ( <img src={require(`../../assets/images/users/${user?.avatar}`)} alt={ user?.name } title={ user?.name } /> )}
                                    </div>
                                    <div className="user-header__info">
                                        <h3 className="user-header__info-name">{ user?.name }</h3>
                                        <p className="user-header__info-description">
                                            Lorem ipsum dolor sit amet consectetur adipisicing elit. 
                                            Corporis iusto quasi, quidem molestias aperiam in earum deleniti amet incidunt possimus.
                                        </p>
                                        <div className="user-header__socials">    
                                            { user?.social && (
                                                <div className="user-header__socials">    
                                                    { user?.socials.facebook && (
                                                        <a href={user.socials.facebook} target='_blank' rel='noopener noreferrer'>
                                                            <svg className="user-header__socials-icon">
                                                                <use xlinkHref={`${svg}#icon-facebook-square`}></use>
                                                            </svg>  
                                                        </a>
                                                    )}
                                                    { user?.socials.linkedin && (
                                                        <a href={user.socials.linkedin} target='_blank' rel='noopener noreferrer'>
                                                            <svg className="user-header__socials-icon">
                                                                <use xlinkHref={`${svg}#icon-linkedin-square`}></use>
                                                            </svg>
                                                        </a>
                                                    )}
                                                    { user?.socials.twitter && (
                                                        <a href={user.socials.twitter} target='_blank' rel='noopener noreferrer'>
                                                            <svg className="user-header__socials-icon">
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
                                <nav className="account-nav">
                                    <ul className="account-nav__ul">
                                        <li className="account-nav__el"><button onClick={ handleNavigationState } name='all-posts' href="#">All posts ({ userPosts?.length })</button></li>
                                        { isUsersData(loggedInUser?._id, user._id) && <li className="account-nav__el"><button onClick={ handleNavigationState } name='account-settings'>Account settings</button></li> }
                                    </ul>
                                </nav>
                            </aside>
                            <main className="account__view">
                                <h2 className="account__view-title">
                                    {  navigationState === 'all-posts' ? 'All Posts' : 'Account Settings' }
                                </h2>
                                { navigationState === 'all-posts' ? (
                                    <section className="account-posts">
                                        <div className="cards cards--account">
                                            { isUsersData(loggedInUser?._id, user._id) && userPosts?.map(post => <ProfileCard key={post._id} post={ post } />) }
                                            { !isUsersData(loggedInUser?._id, user._id) && userPosts?.map(post => <PostCard key={post._id} post={ post } />) }
                                        </div>
                                    </section>
                                ) : <AccountSettings user={ user }/> }
                            </main>
                        </div>
                    </div>
                </Fragment>
            )}
        </Fragment>
    )
}

export default Profile;
