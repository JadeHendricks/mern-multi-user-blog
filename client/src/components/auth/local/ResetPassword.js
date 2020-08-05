import React, { useState, useEffect, useContext } from 'react';
import AuthContext from '../../../context/authContext/AuthContext';
import jwt from 'jsonwebtoken';

const ResetPassword = ({ match }) => {
    const { resetPassword } = useContext(AuthContext);
    const [values, setValues] = useState({ name: '', token: '', newPassword: ''});
    const { token, newPassword } = values;

    useEffect(() => {
        let token = match.params.token;
        let { name } = jwt.decode(token);

        if (token) {
            setValues({ ...values, name, token });
        }
        // eslint-disable-next-line
    }, []);

    const handleOnChange = e => setValues({ ...values, [e.target.name]: e.target.value });

    const handleOnSubmit = async (e) => {
        e.preventDefault();
        resetPassword(newPassword, token);
        setValues({ ...values, newPassword: '' });
    }

    return (
        <div className="container">
            <div class="reset-password-form">
                <h2 class="reset-password-form__title">Reset your password</h2>
                <p class="reset-password-form__description">
                    Enter in your new password to proceed.
                </p>
                <form class="form form--resetPassword" onSubmit={ handleOnSubmit }>
                    <div class="form__group">
                        <label class="form__label" htmlFor="newpassword">New Password</label>
                        <input class="form__input" id="newpassword" onChange={ handleOnChange } name="newpassword" type="password" placeholder="••••••••" />
                    </div>
                    <div class="form__group">
                        <button class="button button--green">Reset Password</button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default ResetPassword;
