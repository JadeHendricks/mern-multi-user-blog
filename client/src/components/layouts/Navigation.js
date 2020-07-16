import React, { Fragment, useContext } from 'react';
import AuthContext from '../../context/authContext/AuthContext';
import { withRouter, NavLink } from 'react-router-dom';

const Navigation = () => {

    const { isAuthenticated, user, logout } = useContext(AuthContext);

    const onLogout = () => logout();

    return (
        <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
            <NavLink activeClassName='active' exact to='/' className="navbar-brand text-light">Mern Authentication</NavLink>
            <button className="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
                <span className="navbar-toggler-icon"></span>
            </button>
            <div className="collapse navbar-collapse" id="navbarSupportedContent">
                <ul className='navbar-nav ml-auto'>
                    <li className='nav-item'> 
                        <NavLink activeClassName='active' exact to='/' className='nav-link text-light'>Home</NavLink>
                    </li>

                    { !isAuthenticated && (
                        <Fragment>
                            <li className='nav-item'>
                                <NavLink activeClassName='active' exact to='/signup' className='nav-link text-light'>Register</NavLink>
                            </li>
                            <li className='nav-item'>
                                <NavLink activeClassName='active' exact to='/signin' className='nav-link text-light'>login</NavLink>
                            </li>
                        </Fragment>
                    )}

                    { isAuthenticated && (
                        <Fragment>
                            <li className='nav-item'>
                                <NavLink activeClassName='active' className='nav-link' to='/random'>Random</NavLink>
                            </li>
                            <li className='nav-item'>
                                <NavLink activeClassName='active' className='nav-link' to='/dashboard'>{ user && user.name }</NavLink>
                            </li>
                            <li className='nav-item'>
                                <NavLink className='nav-link' to='/' style={{ cursor: 'pointer', color: '#fff' }} onClick={ onLogout }>Logout</NavLink>
                            </li>
                        </Fragment>
                    )}

                </ul>
            </div>
        </nav>
    )
}

export default withRouter(Navigation);