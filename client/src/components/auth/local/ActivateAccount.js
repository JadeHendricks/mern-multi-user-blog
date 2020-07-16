import React, { useState, useEffect, useContext } from 'react';
import jwt from 'jsonwebtoken';
import AuthContext from '../../../context/authContext/AuthContext';

const ActivateAccount = ({ match }) => {
    const { activateAccount } = useContext(AuthContext);
    const [values, setValues] = useState({ name: '', token: '' });
    const { name, token } = values;

    useEffect(() => {
        const token = match.params.token;
        if (token) {
            const { name } = jwt.decode(token);
            setValues({  ...values, name, token });
        }
    // eslint-disable-next-line
    }, [match.params.token]);

    const handleActivationClick = async () => {
        activateAccount(token);
    }
    
    return (
        <section className="py-5">
            <div className="col-md-8 offset-md-2 col-12">
                <div className="card border-secondary mb-3">
                    <div className="card-header">Hello <strong className="text-success">{ name }</strong>, ready to activate you account?</div>
                    <div className="card-body">
                        <div className="row">
                            <div className="col-12">
                                <button className="btn btn-outline-primary" onClick={ handleActivationClick }>Activate Account</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}

export default ActivateAccount;
