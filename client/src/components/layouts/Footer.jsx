import React from 'react';
import placeholderFooterImage from '../../assets/images/logo-green.png';
import { Link } from 'react-router-dom';

const Footer = () => {
    return (
        <footer className="footer">
            <div className="footer__logo">
                <img src={ placeholderFooterImage } alt="Multi User Blog" title="Multi User Blog"/>
            </div>
            <ul className="footer__nav">
                <li><Link to="/">About us</Link></li>
                <li><Link to="/">Apps</Link></li>
                <li><Link to="/">Careers</Link></li>
                <li><Link to="/">Contact</Link></li>
            </ul>
            <p className="footer__copyright">© 2020 by Jade Hendricks</p>
        </footer>
    )
}

export default Footer;
