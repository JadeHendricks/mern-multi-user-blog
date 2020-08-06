import React, { useState, useContext } from 'react';
import AuthContext from '../../../context/authContext/AuthContext';

const ForgotPassword = () => {
    const { forgotPassword } = useContext(AuthContext);
    const [values, setValues] = useState({ email: '' });
    const { email } = values;

    const handleOnChange = e => setValues({ ...values, [e.target.name]: e.target.value });

    const handleOnSubmit = async (e) => {
        e.preventDefault();
        forgotPassword(email);
        setValues({ ...values, email: '',});
    }
    
    return (
        <div className="container">
            <div className="forgot-password-form">
                <h2 className="forgot-password-form__title">Forgot password?</h2>
                <p className="forgot-password-form__description">
                    Enter in your email and a reset link will be sent for you to change your password.
                </p>
                <form className="form form--forgotpassword" onSubmit={ handleOnSubmit }>
                    <div className="form__group">
                        <label className="form__label" htmlFor="email">Email address</label>
                        <input className="form__input" id="email" onChange={ handleOnChange } name="email" type="email" placeholder="you@example.com" />
                    </div>
                    <div className="form__group">
                        <button className="button button--green">Send</button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default ForgotPassword;
