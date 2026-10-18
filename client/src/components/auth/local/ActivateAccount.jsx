import React, { useContext } from 'react';
import { useParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import AuthContext from '../../../context/authContext/AuthContext';
import { api } from '../../../lib/api';
import { queryKeys } from '../../../lib/queryKeys';
const ActivateAccount = () => {
    const { token } = useParams();
    const { activateAccount } = useContext(AuthContext);
    // The token is opaque, so the server tells us who it belongs to. The lookup is read-only (it
    // does not use up the link), and Query shares one request between StrictMode's two mounts.
    // A failed lookup is fine: the greeting just stays generic, so no toast and no retry.
    const { data } = useQuery({
        queryKey: queryKeys.activation(token),
        queryFn: ({ signal }) => api.get(`/api/auth/account-activation/${encodeURIComponent(token)}`, { signal }),
        enabled: Boolean(token),
        retry: false,
    });
    const name = typeof data?.name === 'string' ? data.name : '';
    const handleActivationClick = async (e) => {
        e.preventDefault();
        activateAccount(token);
    }
    return (
        <div className="container">
            <div className="forgot-password-form">
                <h2 className="forgot-password-form__title">Hello { name && name.split(' ')[0] }, activate your account now!</h2>
                <p className="forgot-password-form__description">
                    By clicking activate, your account with be verified and ready to use.
                </p>
                <form className="form form--activateaccount">
                    <div className="form__group">
                        <button className="button button--green" onClick={ handleActivationClick }>Activate</button>
                    </div>
                </form>
            </div>
        </div>
    )
}
export default ActivateAccount;
