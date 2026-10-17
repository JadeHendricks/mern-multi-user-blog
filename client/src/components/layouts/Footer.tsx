import placeholderFooterImage from '../../assets/images/logo-green.png';
import { Link } from 'react-router';

const Footer = () => {
    return (
        <footer className="footer">
            <div className="footer__logo">
                <img className="footer__logo-img" src={ placeholderFooterImage } alt="Multi User Blog" title="Multi User Blog"/>
            </div>
            <ul className="footer__nav">
                <li className="footer__nav-item"><Link className="footer__link" to="/">About us</Link></li>
                <li className="footer__nav-item"><Link className="footer__link" to="/">Apps</Link></li>
                <li className="footer__nav-item"><Link className="footer__link" to="/">Careers</Link></li>
                <li className="footer__nav-item"><Link className="footer__link" to="/">Contact</Link></li>
            </ul>
            <p className="footer__copyright">© 2020 by Jade Hendricks</p>
        </footer>
    )
}

export default Footer;
