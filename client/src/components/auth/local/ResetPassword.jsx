import React, { useState, useEffect, useContext } from 'react';
import AuthContext from '../../../context/authContext/AuthContext';

const ResetPassword = ({ match }) => {
    const { resetPassword } = useContext(AuthContext);
    const [values, setValues] = useState({ name: '', token: '', newPassword: ''});
    const { token, newPassword } = values;

    useEffect(() => {
        const token = match.params.token;

        if (token) {
            setValues(current => ({ ...current, token }));
        }
        // eslint-disable-next-line
    }, []);

    const handleOnChange = e => setValues({ ...values, [e.target.name]: e.target.value });

    const handleOnSubmit = async (e) => {
        e.preventDefault();
        resetPassword(newPassword, token);
    }

    return (
        <div className="container">
            <div className="reset-password-form">
                <h2 className="reset-password-form__title">Reset your password</h2>
                <p className="reset-password-form__description">
                    Enter in your new password to proceed.
                </p>
                <form className="form form--resetPassword" onSubmit={ handleOnSubmit }>
                    <div className="form__group">
                        <label className="form__label" htmlFor="newPassword">New Password</label>
                        <input className="form__input" id="newPassword" onChange={ handleOnChange } name="newPassword" type="password" placeholder="••••••••" />
                    </div>
                    <div className="form__group">
                        <button className="button button--green">Reset Password</button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default ResetPassword;
