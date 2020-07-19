import React, { useState, useContext } from 'react';
import { Redirect } from 'react-router-dom';
import { Link } from 'react-router-dom';
import AuthContext from '../../../context/authContext/AuthContext';

const Register = () => {

    const { register, isAuthenticated, user } = useContext(AuthContext);

    const [values, setValues] = useState({ name: '', email: '', password: '', buttonText: 'Register' });
    const { name, email, password, buttonText } = values;

    const handleOnChange = e => setValues({ ...values, [e.target.name]: e.target.value });

    const handleOnSubmit = async (e) => {
        e.preventDefault();
        register(name, email, password);
        setValues({ ...values, name: '', email: '', password: '' });
    }

    if (isAuthenticated && user) {
        return <Redirect to='/' />;
    }
    
    return (
        <div class="login-form">
            <h2 class="login-form__title">Create your account!</h2>
            <form class="form form--signup" onSubmit={ handleOnSubmit }>
                <div class="form__group">
                    <label class="form__label" for="name">Name</label>
                    <input class="form__input" id="name" onChange={ handleOnChange } type="text" placeholder="John Doe" />
                </div>
                <div class="form__group">
                    <label class="form__label" for="email">Email address</label>
                    <input class="form__input" id="email" onChange={ handleOnChange } type="email" placeholder="you@example.com" />
                </div>
                <div class="form__group">
                    <label class="form__label" for="password">Password</label>
                    <input class="form__input" id="password" onChange={ handleOnChange } type="password" placeholder="••••••••" />
                </div>
                <div class="form__group">
                    <div class="form__useraccount-block">
                        <Link to='/login'>Already have an account?</Link>
                    </div>
                </div>
                <div class="form__group">
                    <button type="submit" class="button button--green">Sign up</button>
                </div>
            </form>
        </div>
    )
}

export default Register;
