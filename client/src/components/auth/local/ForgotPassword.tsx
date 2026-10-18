import { useState } from 'react';
import type { ChangeEvent, SubmitEvent } from 'react';
import { useAuth } from '../../../context/authContext/AuthContext';

const ForgotPassword = () => {
    const { forgotPassword } = useAuth();
    const [values, setValues] = useState({ email: '' });
    const { email } = values;

    const handleOnChange = (e: ChangeEvent<HTMLInputElement>) => { setValues({ ...values, [e.target.name]: e.target.value }); };

    const handleOnSubmit = (e: SubmitEvent<HTMLFormElement>) => {
        e.preventDefault();
        void forgotPassword(email);
    }
    
    return (
        <div className="container">
            <div className="recover-form">
                <h2 className="recover-form__title">Forgot password?</h2>
                <p className="recover-form__description">
                    Enter in your email and a reset link will be sent for you to change your password.
                </p>
                <form onSubmit={ handleOnSubmit }>
                    <div className="form-group">
                        <label className="label" htmlFor="email">Email address</label>
                        <input className="input" id="email" onChange={ handleOnChange } name="email" type="email" placeholder="you@example.com" />
                    </div>
                    <div className="form-group">
                        <button className="button button--green form-group__submit">Send</button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default ForgotPassword;
