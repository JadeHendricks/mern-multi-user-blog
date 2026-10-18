import footerLogo from '../../assets/images/logo-green.png';
import { Link } from 'react-router';

const Footer = () => {
    return (
        <footer className="footer">
            <div className="footer__logo">
                <img className="footer__logo-img" src={ footerLogo } alt="Multi User Blog" title="Multi User Blog"/>
            </div>
            <ul className="footer__nav">
                <li className="footer__nav-item"><Link className="footer__link" to="/">All Posts</Link></li>
                <li className="footer__nav-item"><Link className="footer__link" to="/users">All Users</Link></li>
                <li className="footer__nav-item"><Link className="footer__link" to="/most-popular-posts">Popular Posts</Link></li>
                <li className="footer__nav-item"><a className="footer__link" href="https://github.com/JadeHendricks/mern-multi-user-blog" target="_blank" rel="noopener noreferrer">GitHub</a></li>
            </ul>
            <p className="footer__copyright">© 2020 by Jade Hendricks</p>
        </footer>
    )
}

export default Footer;
