import React, { useState, useEffect, useContext } from 'react';
import { useParams } from 'react-router';
import axios from 'axios';
import AuthContext from '../../../context/authContext/AuthContext';

const ActivateAccount = () => {
    const params = useParams();
    const { activateAccount } = useContext(AuthContext);
    const [values, setValues] = useState({ name: '', token: '' });
    const { name, token } = values;

    useEffect(() => {
        const token = params.token;
        if (token) {
            // The token is opaque now, so the server tells us who it belongs to.
            let cancelled = false;
            setValues(current => ({ ...current, token }));
            axios.get(`/api/auth/account-activation/${encodeURIComponent(token)}`)
                .then(res => {
                    if (!cancelled && res.data && typeof res.data.name === 'string') {
                        setValues(current => ({ ...current, name: res.data.name }));
                    }
                })
                // Generic greeting is fine when the lookup fails.
                .catch(() => {});
            return () => { cancelled = true; };
        }
    // eslint-disable-next-line
    }, [params.token]);

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
