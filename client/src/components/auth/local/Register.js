import React, { useState, useContext } from 'react';
import { Redirect } from 'react-router-dom';
import { Link } from 'react-router-dom';
import AuthContext from '../../../context/authContext/AuthContext';
import Google from '../external/Google';
import Facebook from '../external/Facebook';

const Register = () => {

    const { register, isAuthenticated, user } = useContext(AuthContext);

    const [values, setValues] = useState({ name: '', email: '', password: '', buttonText: 'Register' });
    const { name, email, password, buttonText } = values;

    const handleOnChange = e => setValues({ ...values, [e.target.name]: e.target.value });

    const handleOnSubmit = async (e) => {
        e.preventDefault();
        setValues({ ...values, buttonText: 'Registering...' });
        register(name, email, password);
        setValues({ ...values, name: '', email: '', password: '', buttonText: 'Register' });
    }

    if (isAuthenticated && user) {
        return <Redirect to='/dashboard' />;
    }
    
    return (
        <section className="py-5">
            <div className="col-md-8 offset-md-2 col-sm-12">
                <div className="card border-secondary mb-3">
                    <div className="card-header">Register</div>
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
                                        <label className="text-muted" htmlFor="name">Name</label>
                                        <input onChange={ handleOnChange } name="name" placeholder="Name" value={ name } type="text" className="form-control"/>
                                    </div>
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

export default Register;
