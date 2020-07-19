import React, { Fragment } from 'react';
import svg from '../../assets/images/icons/sprite.svg'
import AccountPosts from './AccountPosts';
import AccountLikedPosts from './AccountLikedPosts';
import AccountSettings from './AccountSettings';

const Profile = () => {
    return (
        <Fragment>
            <div className="post">
                <div className="post__banner post__banner--account">
                    <div className="container">
                        <div className="user-header">
                            <div className="user-header__image">
                                <img src="./images/jade-hendricks.jpg" alt="Photo of Jade Hendricks" title="Photo of Jade Hendricks" />
                            </div>
                            <div className="user-header__info">
                                <h3 className="user-header__info-name">Lorem ipsum</h3>
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
            <div class="container">
                <div class="account">
                    <aside class="account__options">
                        <nav class="account-nav">
                            <ul class="account-nav__ul">
                                <li class="account-nav__el"><a href="#">All posts</a></li>
                                <li class="account-nav__el"><a href="#">Liked posts</a></li>
                                <li class="account-nav__el"><a href="#">Account settings</a></li>
                            </ul>
                        </nav>
                    </aside>
                    <main class="account__view">
                        <h2 class="account__view-title">All Your Posts</h2>
                        <AccountPosts />
                        <AccountLikedPosts />
                        <AccountSettings />
                    </main>
                </div>
            </div>
        </Fragment>
    )
}

export default Profile;
