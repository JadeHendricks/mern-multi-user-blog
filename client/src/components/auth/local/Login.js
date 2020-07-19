import React, { useState, useContext } from 'react';
import AuthContext from '../../../context/authContext/AuthContext';
import { Link, Redirect } from 'react-router-dom';

const Login = () => {

    const { login, isAuthenticated, user }  = useContext(AuthContext);

    const [values, setValues] = useState({ email: '', password: ''});
    const { email, password } = values;

    const handleOnChange = e => setValues({ ...values, [e.target.name]: e.target.value });

    const handleOnSubmit = async (e) => {
        e.preventDefault();
        login(email, password);
        setValues({ ...values, email: '', password: '' });
    }

    if (isAuthenticated && user) {
        return <Redirect to='/' />;
    }
    
    return (
        <div class="login-form">
            <h2 class="login-form__title">Log into your account</h2>
            <form class="form form--login" onSubmit={ handleOnSubmit }>
                <div class="form__group">
                    <label class="form__label" for="email">Email address</label>
                    <input class="form__input" id="email" name="email" type="email" onChange={ handleOnChange }  placeholder="you@example.com" />
                </div>
                <div class="form__group">
                    <label class="form__label" for="password">Password</label>
                    <input class="form__input" id="password" name="password" onChange={ handleOnChange } type="password" placeholder="••••••••" />
                </div>
                <div class="form__group">
                    <div class="form__useraccount-block">
                        <Link to='/register'>Don't have an account?</Link>
                        <Link to='/forgot-password'>Forgot password?</Link>
                    </div>
                </div>
                <div class="form__group">
                    <button type="submit" class="button button--green">Login</button>
                </div>
            </form>
        </div>
    )
}

export default Login;
