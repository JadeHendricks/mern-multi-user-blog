import React from 'react';
import placeholderFooterImage from '../../assets/images/logo-green.png';

const Footer = () => {
    return (
        <footer className="footer">
            <div className="footer__logo">
                <img src={ placeholderFooterImage } alt="Multi User Blog" title="Multi User Blog"/>
            </div>
            <ul className="footer__nav">
                <li><a href="#">About us</a></li>
                <li><a href="#">Download apps</a></li>
                <li><a href="#">Become a guide</a></li>
                <li><a href="#">Careers</a></li>
                <li><a href="#">Contact</a></li>
            </ul>
            <p className="footer__copyright">© 2020 by Jade Hendricks</p>
        </footer>
    )
}

export default Footer;
