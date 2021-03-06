import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import AuthContext from '../../context/authContext/AuthContext';
import { withRouter } from 'react-router-dom';
import SiteLogoW from '../../assets/images/logo-white.png';

const Navigation = () => {
    const { isAuthenticated, loggedInUser, logout } = useContext(AuthContext);

    const onLogout = () => logout();

    return (
        <header className="header">
            <nav className="nav nav--posts">
                <div className="header__logo">
                    <Link to='/'><img src={ SiteLogoW } alt="Multi User Blog" title="Multi User Blog"/></Link>
                </div>
                <Link to='/' className="nav__el">All Posts</Link>
            </nav>
            { !isAuthenticated &&  (
                <nav className="nav nav__user">
                    <Link className="nav__el" to='/users'>All Users</Link>
                    <Link className="nav__el" to='/most-popular-posts'>Popular Posts</Link>
                    <Link className="nav__el" to='/login'>Log in</Link>
                    <Link className="nav__el nav__el--cta" to='/register'>Register</Link>
                </nav>
            )}

            { isAuthenticated && loggedInUser && (
                <nav className="nav nav__user">
                    <Link className="nav__el" to='/users'>All Users</Link>
                    <Link className="nav__el" to='/most-popular-posts'>Popular Posts</Link>
                    <Link className="nav__el" to={`/profile/${loggedInUser._id}`}>
                        <img className="nav__user-img" src={require(`../../assets/images/users/default.jpg`)} alt={ loggedInUser?.name } title={ loggedInUser?.name } />
                        <span>{ loggedInUser.name.split(' ')[0] }</span>
                    </Link>
                    <Link to='/create-post' className="nav__el button button--green">Create Post</Link>
                    <a className="nav__el nav__el--logout" href="#!" onClick={ onLogout }>Log out</a>
                </nav> 
            )}
        </header>
    )
}

export default withRouter(Navigation);