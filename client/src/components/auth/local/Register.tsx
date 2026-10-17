import { useState } from 'react';
import type { ChangeEvent, SubmitEvent } from 'react';
import { Link, Navigate } from 'react-router';
import { useAuth } from '../../../context/authContext/AuthContext';

const Register = () => {

    const { register, isAuthenticated, loggedInUser } = useAuth();

    const [values, setValues] = useState({ name: '', email: '', password: ''});
    const { name, email, password } = values;

    const handleOnChange = (e: ChangeEvent<HTMLInputElement>) => { setValues({ ...values, [e.target.name]: e.target.value }); };

    const handleOnSubmit = (e: SubmitEvent<HTMLFormElement>) => {
        e.preventDefault();

        void register(name, email, password);
    }

    if (isAuthenticated && loggedInUser) {
        return <Navigate to='/' replace />;
    }
    
    return (
        <div className="container">
            <div className="login-form">
                <h2 className="login-form__title">Create your account!</h2>
                <form className="form form--signup" onSubmit={ handleOnSubmit }>
                    <div className="form-group">
                        <label className="label" htmlFor="name">Name</label>
                        <input className="input" id="name" name="name" onChange={ handleOnChange } type="text" placeholder="John Doe" />
                    </div>
                    <div className="form-group">
                        <label className="label" htmlFor="email">Email address</label>
                        <input className="input" id="email" name="email" onChange={ handleOnChange } type="email" placeholder="you@example.com" />
                    </div>
                    <div className="form-group">
                        <label className="label" htmlFor="password">Password</label>
                        <input className="input" id="password" name="password" onChange={ handleOnChange } type="password" placeholder="••••••••" />
                    </div>
                    <div className="form-group">
                        <div className="form-links">
                            <Link className="form-links__link" to='/login'>Already have an account?</Link>
                        </div>
                    </div>
                    <div className="form-group">
                        <button type="submit" className="button button--green form-group__submit">Sign up</button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default Register;
