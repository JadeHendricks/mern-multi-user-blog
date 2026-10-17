import { Link } from 'react-router';
import { useAuth } from '../../context/authContext/AuthContext';
import SiteLogoW from '../../assets/images/logo-white.png';
import { uploadUrl, onImageError } from '../../utils/imageUrl';

const Navigation = () => {
    const { isAuthenticated, loggedInUser, logout } = useAuth();

    const onLogout = () => void logout();

    return (
        <header className="header">
            <nav className="nav nav--posts">
                <div className="header__logo">
                    <Link to='/'><img className="header__logo-img" src={ SiteLogoW } alt="Multi User Blog home" title="Multi User Blog"/></Link>
                </div>
                <Link to='/' className="nav__el">All Posts</Link>
            </nav>
            { !isAuthenticated &&  (
                <nav className="nav nav--user">
                    <Link className="nav__el" to='/users'>All Users</Link>
                    <Link className="nav__el" to='/most-popular-posts'>Popular Posts</Link>
                    <Link className="nav__el" to='/login'>Log in</Link>
                    <Link className="nav__el nav__el--cta" to='/register'>Register</Link>
                </nav>
            )}

            { isAuthenticated && loggedInUser && (
                <nav className="nav nav--user">
                    <Link className="nav__el" to='/users'>All Users</Link>
                    <Link className="nav__el" to='/most-popular-posts'>Popular Posts</Link>
                    <Link className="nav__el" to={`/profile/${loggedInUser._id}`}>
                        <img className="avatar nav__avatar" src={ uploadUrl('users', loggedInUser.avatar) } onError={ onImageError('users') } alt="" />
                        <span>{ loggedInUser.name.split(' ')[0] }</span>
                    </Link>
                    <Link to='/create-post' className="nav__el nav__el--create">Create Post</Link>
                    <button type="button" className="nav__el nav__el--button" onClick={ onLogout }>Log out</button>
                </nav> 
            )}
        </header>
    )
}

export default Navigation;