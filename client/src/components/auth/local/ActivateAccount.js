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

    const handleActivationClick = async (e) => {
        e.preventDefault();
        activateAccount(token);
    }
    
    return (
        <div className="container">
            <div className="forgot-password-form">
                <h2 className="forgot-password-form__title">Hello { name && name.split(' ')[0] }, activate your account now!</h2>
                <p className="forgot-password-form__description">
                    By clicking activate, your account with be verified and ready to use.
                </p>
                <form className="form form--activateaccount">
                    <div className="form__group">
                        <button className="button button--green" onClick={ handleActivationClick }>Activate</button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default ActivateAccount;
