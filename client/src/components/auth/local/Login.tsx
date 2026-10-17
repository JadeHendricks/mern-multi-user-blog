import { useState } from 'react';
import type { ChangeEvent, SubmitEvent } from 'react';
import { useAuth } from '../../../context/authContext/AuthContext';
import { Link, Navigate } from 'react-router';

const Login = () => {

    const { login, isAuthenticated, loggedInUser }  = useAuth();

    const [values, setValues] = useState({ email: '', password: ''});
    const { email, password } = values;

    const handleOnChange = (e: ChangeEvent<HTMLInputElement>) => { setValues({ ...values, [e.target.name]: e.target.value }); };

    const handleOnSubmit = (e: SubmitEvent<HTMLFormElement>) => {
        e.preventDefault();
        void login(email, password);
    }

    if (isAuthenticated && loggedInUser) {
        return <Navigate to='/' replace />;
    }
    
    return (
        <div className="container">
            <div className="login-form">
                <h2 className="login-form__title">Log into your account</h2>
                <form onSubmit={ handleOnSubmit }>
                    <div className="form-group">
                        <label className="label" htmlFor="email">Email address</label>
                        <input className="input" id="email" name="email" type="email" onChange={ handleOnChange }  placeholder="you@example.com" />
                    </div>
                    <div className="form-group">
                        <label className="label" htmlFor="password">Password</label>
                        <input className="input" id="password" name="password" onChange={ handleOnChange } type="password" placeholder="••••••••" />
                    </div>
                    <div className="form-group">
                        <div className="form-links">
                            <Link className="form-links__link" to='/register'>Don&apos;t have an account?</Link>
                            <Link className="form-links__link" to='/forgot-password'>Forgot password?</Link>
                        </div>
                    </div>
                    <div className="form-group">
                        <button type="submit" className="button button--green form-group__submit">Login</button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default Login;
