import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import AuthContext from '../../context/authContext/AuthContext';
import { withRouter } from 'react-router-dom';
import SiteLogoW from '../../assets/images/logo-white.png';
import placeholderUserImage from '../../assets/images/jade-hendricks.jpg';

const Navigation = () => {

    const { isAuthenticated, loggedInUser, logout } = useContext(AuthContext);

    const onLogout = () => logout();

    return (
        <header className="header">
            <nav className="nav nav--posts">
                <Link to='/' className="nav__el">All Posts</Link>
            </nav>
            <div className="header__logo">
                <Link to='/'><img src={ SiteLogoW } alt="Multi User Blog" title="Multi User Blog"/></Link>
            </div>
            { !isAuthenticated &&  (
                <nav className="nav nav__user">
                    <Link className="nav__el" to='/users'>All Users</Link>
                    <Link className="nav__el" to='/login'>Log in</Link>
                    <Link className="nav__el nav__el--cta" to='/register'>Register</Link>
                </nav>
            )}

            { isAuthenticated && (
                <nav className="nav nav__user">
                    <Link className="nav__el" to='/users'>All Users</Link>
                    <Link className="nav__el" to='/most-popular-posts'>Popular Posts</Link>
                    <Link className="nav__el" to={`/profile/${loggedInUser._id}`}>
                        <img className="nav__user-img" src={ placeholderUserImage } alt={ loggedInUser.name } title={ loggedInUser.name } />
                        <span>{ loggedInUser.name.split(' ')[0] }</span>
                    </Link>
                    <Link to='/create-post' className="nav__el button button--green">Create Post</Link>
                    <a className="nav__el nav__el--logout" onClick={ onLogout }>Log out</a>
                </nav> 
            )}
        </header>
    )
}

export default withRouter(Navigation);