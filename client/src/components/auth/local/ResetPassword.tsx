import { useState } from 'react';
import type { ChangeEvent, SubmitEvent } from 'react';
import { useParams } from 'react-router';
import { useAuth } from '../../../context/authContext/AuthContext';

const ResetPassword = () => {
    const { resetPassword } = useAuth();
    const [values, setValues] = useState({ name: '', newPassword: ''});
    const { newPassword } = values;

    // The token comes straight from the URL, so derive it while rendering instead of copying it
    // into state in an effect.
    // The route always has :token; the empty default only satisfies the types (the API sees a missing link as empty too).
    const { token = '' } = useParams();

    const handleOnChange = (e: ChangeEvent<HTMLInputElement>) => { setValues({ ...values, [e.target.name]: e.target.value }); };

    const handleOnSubmit = (e: SubmitEvent<HTMLFormElement>) => {
        e.preventDefault();
        void resetPassword(newPassword, token);
    }

    return (
        <div className="container">
            <div className="reset-password-form">
                <h2 className="reset-password-form__title">Reset your password</h2>
                <p className="reset-password-form__description">
                    Enter in your new password to proceed.
                </p>
                <form onSubmit={ handleOnSubmit }>
                    <div className="form-group">
                        <label className="label" htmlFor="newPassword">New Password</label>
                        <input className="input" id="newPassword" onChange={ handleOnChange } name="newPassword" type="password" placeholder="••••••••" />
                    </div>
                    <div className="form-group">
                        <button className="button button--green form-group__submit">Reset Password</button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default ResetPassword;
