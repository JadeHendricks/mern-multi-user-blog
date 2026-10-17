import type { MouseEvent } from 'react';
import { useParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import type { ActivationPreviewResponse } from '@mern-blog/shared';
import { useAuth } from '../../../context/authContext/AuthContext';
import { api } from '../../../lib/api';
import { queryKeys } from '../../../lib/queryKeys';
const ActivateAccount = () => {
    // The route always has :token; the empty default only satisfies the types (`enabled` keeps the lookup off without it).
    const { token = '' } = useParams();
    const { activateAccount } = useAuth();
    // The token is opaque, so the server tells us who it belongs to. The lookup is read-only (it
    // does not use up the link), and Query shares one request between StrictMode's two mounts.
    // A failed lookup is fine: the greeting just stays generic, so no toast and no retry.
    const { data } = useQuery({
        queryKey: queryKeys.activation(token),
        queryFn: ({ signal }) => api.get<ActivationPreviewResponse>(`/api/auth/account-activation/${encodeURIComponent(token)}`, { signal }),
        enabled: Boolean(token),
        retry: false,
    });
    const name = typeof data?.name === 'string' ? data.name : '';
    const handleActivationClick = (e: MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        void activateAccount(token);
    }
    return (
        <div className="container">
            <div className="forgot-password-form">
                <h2 className="forgot-password-form__title">Hello { name.split(' ')[0] }, activate your account now!</h2>
                <p className="forgot-password-form__description">
                    By clicking activate, your account with be verified and ready to use.
                </p>
                <form className="form form--activateaccount">
                    <div className="form-group">
                        <button className="button button--green form-group__submit" onClick={ handleActivationClick }>Activate</button>
                    </div>
                </form>
            </div>
        </div>
    )
}
export default ActivateAccount;
