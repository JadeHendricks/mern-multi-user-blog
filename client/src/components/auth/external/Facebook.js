import React, { useContext } from 'react';
import FacebookLogin from 'react-facebook-login/dist/facebook-login-render-props'
import AuthContext from '../../../context/authContext/AuthContext';

const Facebook = () => {
    const { externalResponse } = useContext(AuthContext);
    const responseFacebook = async (response) => externalResponse(response);
    
    return (
        <div className='pb-3'>
            <FacebookLogin
                appId={`${process.env.REACT_APP_FACEBOOK_APP_ID}`}
                autoLoad={ false }
                callback={ responseFacebook }
                render={ renderProps => (
                    <button onClick={ renderProps.onClick } className="btn btn-primary btn-block">Login with Facebook</button>
                )}
            />
        </div>
    )
}

export default Facebook;
