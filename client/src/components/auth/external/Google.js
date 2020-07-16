import React, { useContext } from 'react';
import GoogleLogin from 'react-google-login';
import AuthContext from '../../../context/authContext/AuthContext';

const Google = () => {
    const { externalResponse } = useContext(AuthContext);
    const responseGoogle = (response) => externalResponse(response);

    return (
        <div className='pb-3'>
            <GoogleLogin
                clientId={`${process.env.REACT_APP_GOOGLE_CLIENT_ID}`}
                render={ renderProps => (
                    <button onClick={ renderProps.onClick } disabled={ renderProps.disabled } className="btn btn-danger btn-block">Login with Google</button>
                )}
                onSuccess={ responseGoogle }
                onFailure={ responseGoogle }
                cookiePolicy={'single_host_origin'}
            />
        </div>
    )
}

export default Google;
