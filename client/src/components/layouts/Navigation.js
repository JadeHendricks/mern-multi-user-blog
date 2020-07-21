import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import AuthContext from '../../context/authContext/AuthContext';
import { withRouter } from 'react-router-dom';

const Navigation = () => {

    const { isAuthenticated, user, logout } = useContext(AuthContext);

    const onLogout = () => logout();

    return (
        <header className="header">
            <nav className="nav nav--posts">
                <Link to='/' className="nav__el">All Posts</Link>
            </nav>
            <div className="header__logo">
                <Link to='/'><img src="./images/logo-white.png" alt="" /></Link>
            </div>
            { !isAuthenticated &&  (
                <nav className="nav nav__user">
                    <Link className="nav__el" to='/login'>Log in</Link>
                    <Link className="nav__el nav__el--cta" to='/register'>Register</Link>
                </nav>
            )}

            { isAuthenticated && (
                <nav className="nav nav__user">
                    <Link to='create-post' className="nav__el button button--green">Create Post</Link>
                    <Link className="nav__el" to="/profile/me">
                        <img className="nav__user-img" src="./images/jade-hendricks.jpg" alt={user.name} title={user.name} />
                        <span>{ user && user.name.split(' ')[0] }</span>
                    </Link>
                    <a className="nav__el nav__el--logout" onClick={ onLogout }>Log out</a>
                </nav> 
            )}
        </header>
    )
}

export default withRouter(Navigation);