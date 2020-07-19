import React, { useState, useEffect, useContext } from 'react';
import jwt from 'jsonwebtoken';
import AuthContext from '../../../context/authContext/AuthContext';

const ActivateAccount = ({ match }) => {
    const { activateAccount } = useContext(AuthContext);
    const [values, setValues] = useState({ name: '', token: '' });
    const { name, token } = values;

    useEffect(() => {
        const token = match.params.token;
        if (token) {
            const { name } = jwt.decode(token);
            setValues({  ...values, name, token });
        }
    // eslint-disable-next-line
    }, [match.params.token]);

    const handleActivationClick = async () => {
        activateAccount(token);
    }
    
    return (
        <div class="forgot-password-form">
            <h2 class="forgot-password-form__title">Hello Name, activate your account now!</h2>
            <p class="forgot-password-form__description">
                By clicking activate, your account with be verified and ready to use.
            </p>
            <form class="form form--activateaccount">
                <div class="form__group">
                    <button class="button button--green" onClick={ handleActivationClick }>Activate</button>
                </div>
            </form>
        </div>
    )
}

export default ActivateAccount;
