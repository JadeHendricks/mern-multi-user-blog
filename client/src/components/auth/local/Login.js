import React, { useState, useContext } from 'react';
import AuthContext from '../../../context/authContext/AuthContext';
import { Link, Redirect } from 'react-router-dom';
import Google from '../external/Google';
import Facebook from '../external/Facebook';

const Login = () => {

    const { login, isAuthenticated, user }  = useContext(AuthContext);

    const [values, setValues] = useState({ email: '', password: '', buttonText: 'Login' });
    const { email, password, buttonText } = values;

    const handleOnChange = e => setValues({ ...values, [e.target.name]: e.target.value });

    const handleOnSubmit = async (e) => {
        e.preventDefault();
        setValues({ ...values, buttonText: 'Logging in...' });
        login(email, password);
        setValues({ ...values, email: '', password: '', buttonText: 'Login' });
    }

    if (isAuthenticated && user) {
        return <Redirect to='/dashboard' />;
    }
    
    return (
        <section className="py-5">
            <div className="col-md-8 offset-md-2 col-sm-12">
                <div className="card border-secondary mb-3">
                    <div className="card-header">Login</div>
                    <div className="card-body">
                        <div className="row">
                            <div className="col-sm-6 col-12">
                                <Google />
                            </div>
                            <div className="col-sm-6 col-12">
                                <Facebook />
                            </div>
                        </div>
                        <div className="row">
                            <div className="col-12">
                                <form onSubmit={ handleOnSubmit }>
                                    <div className="form-group">
                                        <label className="text-muted" htmlFor="email">Email address</label>
                                        <input onChange={ handleOnChange } placeholder="you@example.com" name="email" value={ email } type="email" className="form-control"/>
                                    </div>
                                    <div className="form-group">
                                        <label className="text-muted" htmlFor="password">Password</label>
                                        <input onChange={ handleOnChange } placeholder="••••••••" name="password" value={ password } type="password" className="form-control"/>
                                    </div>
                                    <div className="form-group">
                                        <button className="btn btn-primary" type="submit">{ buttonText }</button>
                                    </div>
                                </form>
                                <hr />
                                <Link to='/forgot-password' className='text-danger'>Forgot password</Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}

export default Login;
