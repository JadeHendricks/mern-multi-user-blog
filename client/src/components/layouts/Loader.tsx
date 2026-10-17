import React, { useContext, Fragment } from 'react';
import AuthContext from '../../context/authContext/AuthContext';

const Loader = () => {
    const { isAuthenticated } = useContext(AuthContext);

    return (
        <Fragment>
            { isAuthenticated === null && (
                <div className="loader-container">
                    <div className="loader">
                        <div className="inner one"></div>
                        <div className="inner two"></div>
                        <div className="inner three"></div>
                    </div>
                </div>
            ) }
        </Fragment>
    )
}

export default Loader;