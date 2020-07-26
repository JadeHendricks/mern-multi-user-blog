import React, { Fragment, useEffect, useState, useContext } from 'react';
import svg from '../../assets/images/icons/sprite.svg'
import ProfileCard from '../cards/ProfileCard';
import PostCard from '../cards/PostCard';
import AccountSettings from './AccountSettings';
import axios from 'axios';
import { toast } from 'react-toastify';
import placeholderUserImage from '../../assets/images/jade-hendricks.jpg';
import AuthContext from '../../context/authContext/AuthContext';

const Profile = ({ match }) => {
    const { loggedInUser } = useContext(AuthContext);

    const [ user, setUser ] = useState({});
    const [ allUsersPosts, setAllUsersPosts ] = useState({
        userPosts: [],
        results: ''
    });

    const { userPosts, userPostsResults } = allUsersPosts;

    const getUser = async (id) => {
        try {
            const res = await axios.get(`/api/user/${id}`);
            setUser(res.data.user);
        } catch (err) {
            console.log(err.response.message);
        }
    }

    const getAllUsersPosts = async (id) => { 
        try {
            const res = await axios.get(`/api/post/user/${id}`);
            setAllUsersPosts({
                userPosts: res.data.posts,
                userPostsResults: res.data.results
            });
        } catch (err) {
            console.log(err.response.message);
        }
    }

    const isUsersData = () => {
        if (loggedInUser) {
            return loggedInUser._id === user._id;
        }
    }

    useEffect(() => {
        getUser(match.params.id);
        getAllUsersPosts(match.params.id);
    }, [match.params.id, loggedInUser]);

    return (
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
                                <li className="account-nav__el"><a href="#">All posts ({ userPostsResults })</a></li>
                                <li className="account-nav__el"><a href="#">Liked posts</a></li>
                                { isUsersData() && <li className="account-nav__el"><a href="#">Account settings</a></li> }
                            </ul>
                        </nav>
                    </aside>
                    <main className="account__view">
                        <h2 className="account__view-title">All Your Posts</h2>
                        <section className="account-posts">
                            <div className="cards cards--account">
                                { isUsersData() && userPosts.map(post => <ProfileCard key={post._id} post={ post } />) }
                                { !isUsersData() && userPosts.map(post => <PostCard key={post._id} post={ post } />) }
                            </div>
                        </section>
                        <section className="account-liked-posts">
                            <div className="cards cards--account">
                                {/* <PostCard /> */}
                            </div>
                        </section>
                        {/* <AccountSettings /> */}
                    </main>
                </div>
            </div>
        </Fragment>
    )
}

export default Profile;
