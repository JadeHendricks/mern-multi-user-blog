import React, { useState, useContext } from 'react';
import { useParams } from 'react-router';
import AuthContext from '../../../context/authContext/AuthContext';

const ResetPassword = () => {
    const { resetPassword } = useContext(AuthContext);
    const [values, setValues] = useState({ name: '', newPassword: ''});
    const { newPassword } = values;

    // The token comes straight from the URL, so derive it while rendering instead of copying it
    // into state in an effect.
    const { token } = useParams();

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
