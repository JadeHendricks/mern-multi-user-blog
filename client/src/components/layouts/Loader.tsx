import { Fragment } from 'react';
import { useAuth } from '../../context/authContext/AuthContext';

const Loader = () => {
    const { isAuthenticated } = useAuth();

    return (
        <Fragment>
            { isAuthenticated === null && (
                <div className="loader">
                    <div className="loader__spinner">
                        <div className="loader__ring loader__ring--one"></div>
                        <div className="loader__ring loader__ring--two"></div>
                        <div className="loader__ring loader__ring--three"></div>
                    </div>
                </div>
            ) }
        </Fragment>
    )
}

export default Loader;