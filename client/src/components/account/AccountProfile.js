import React, { Fragment, useEffect, useContext } from 'react';
import svg from '../../assets/images/icons/sprite.svg'
import ProfileCard from '../cards/ProfileCard';
import PostCard from '../cards/PostCard';
import AccountSettings from './AccountSettings';
import Loader from '../layouts/Loader';
import placeholderUserImage from '../../assets/images/jade-hendricks.jpg';
import UserContext from '../../context/userContext/UserContext';
import PostContext from '../../context/postContext/PostContext';
import AuthContext from '../../context/authContext/AuthContext';

const Profile = ({ match }) => {

    const { getUser, user } = useContext(UserContext);
    const { getAllUsersPosts, userPosts } = useContext(PostContext);
    const { loggedInUser } = useContext(AuthContext);

    useEffect(() => {
        getUser(match.params.id);
        getAllUsersPosts(match.params.id);
    }, []);

    return (
        <Fragment>
            { !loggedInUser || !user || userPosts.length === 0 ? <Loader /> : (
                <Fragment>
                    <div className="post">
                        <div className="post__banner post__banner--account">
                            <div className="container">
                                <div className="user-header">
                                    <div className="user-header__image">
                                        <img src={ placeholderUserImage } alt={ user.name } title={ user.name } />
                                    </div>
                                    <div className="user-header__info">
                                        <h3 className="user-header__info-name">{ user.name }</h3>
                                        <p className="user-header__info-description">
                                            Lorem ipsum dolor sit amet consectetur adipisicing elit. 
                                            Corporis iusto quasi, quidem molestias aperiam in earum deleniti amet incidunt possimus.
                                        </p>
                                        <div className="user-header__socials">    
                                            <svg className="user-header__socials-icon">
                                                <use xlinkHref={`${svg}#icon-facebook-square`}></use>
                                            </svg>                                  
                                            <svg className="user-header__socials-icon">
                                                <use xlinkHref={`${svg}#icon-linkedin-square`}></use>
                                            </svg>                                  
                                            <svg className="user-header__socials-icon">
                                                <use xlinkHref={`${svg}#icon-twitter-square`}></use>
                                            </svg>                                  
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
                                        <li className="account-nav__el"><a href="#">All posts</a></li>
                                        <li className="account-nav__el"><a href="#">Liked posts</a></li>
                                        { loggedInUser._id === user._id && <li className="account-nav__el"><a href="#">Account settings</a></li> }
                                    </ul>
                                </nav>
                            </aside>
                            <main className="account__view">
                                <h2 className="account__view-title">All Your Posts</h2>
                                <section class="account-posts">
                                    <div class="cards cards--account">
                                        { loggedInUser._id === user._id && userPosts.map(post => <ProfileCard key={post._id} post={ post } />) }
                                        { loggedInUser._id !== user._id && userPosts.map(post => <PostCard key={post._id} post={ post } />) }
                                    </div>
                                </section>
                                <section class="account-liked-posts">
                                    <div class="cards cards--account">
                                        {/* <PostCard /> */}
                                    </div>
                                </section>
                                {/* <AccountSettings /> */}
                            </main>
                        </div>
                    </div>
                </Fragment>
            ) }
        </Fragment>
    )
}

export default Profile;
