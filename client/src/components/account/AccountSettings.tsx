import { Fragment, useState } from 'react';
import type { ChangeEvent } from 'react';
import type { PublicUserDto } from '@mern-blog/shared';
import { uploadUrl, onImageError } from '../../utils/imageUrl';
import { useUpdateProfile } from '../../hooks/useUpdateProfile';
import { useUpdateSocials } from '../../hooks/useUpdateSocials';

interface AccountSettingsProps {
    // Partial: AccountProfile passes an empty object until the profile has arrived.
    user: Partial<PublicUserDto>;
    email: string | undefined;
}

const AccountSettings = ({ user, email }: AccountSettingsProps) => {
    const updateUser = useUpdateProfile();
    const updateUserSocials = useUpdateSocials(user._id ?? '');

    // Initial values come from props via lazy state. AccountProfile keys this component by user id,
    // so a different user remounts it instead of leaving the previous user's values in the form.
    const [ userSocials, setUserSocials] = useState(() => ({
        facebook: user.socials?.facebook ?? '',
        twitter: user.socials?.twitter ?? '',
        linkedin: user.socials?.linkedin ?? ''
    }));
    const handleSocialsOnChange = (e: ChangeEvent<HTMLInputElement>) => { setUserSocials({ ...userSocials, [e.target.name]: e.target.value }); };
    const {facebook, linkedin, twitter} = userSocials;

    const [ name, setName] = useState(() => user.name ?? '');
    const [ avatar, setAvatar] = useState<File | undefined>();
    const [ uploadName, setUploadName] = useState('');

    
    return (
        <Fragment>
            <section className="account-settings">
                <form className="form form--account" onSubmit={ (e) => {
                    e.preventDefault();
                    updateUser.mutate({ name, avatar });
                } }>
                    <div className="form-group">
                        <label className="label" htmlFor="name">Name</label>
                        <input className="input" id="name" value={ name || '' } onChange={ e => {
                            const value = e.target.value;
                            setName(value);
                        } } />
                    </div>
                    <div className="form-group">
                        <label className="label" htmlFor="email">Email</label>
                        <input className="input" id="email" name="email" value={ email ?? '' } placeholder="yourname@example.com" disabled></input>
                    </div>
                    <div className="form-group form-group--upload">
                        <img className="avatar form__user-photo" src={ uploadUrl('users', user.avatar) } onError={ onImageError('users') } alt={ user.name } title={ user.name } />
                        <input className="form__upload" type="file" accept="image/*" id="avatar" name="avatar" onChange={ e => {
                            const file = e.target.files?.[0];
                            setAvatar(file);
                            setUploadName(e.target.value.slice(12));
                        } } />
                        <label htmlFor="avatar">{ uploadName ? uploadName : 'Choose a new profile picture'}</label>
                    </div>
                    <div className="form-group">
                        <button type="submit" className="button button--green form-group__submit">Update Account</button>
                    </div>
                </form>
            </section>

            <h2 className="account__view-title">Socials</h2>
            
            <section className="account-settings">
                <form className="form form--account" onSubmit={ (e) => {
                    e.preventDefault();
                    updateUserSocials.mutate({ facebook, linkedin, twitter }) }
                    }>
                    <div className="form-group">
                        <label className="label" htmlFor="facebook">Facebook URL</label>
                        <input className="input" id="facebook" name="facebook" value={ facebook } onChange={ handleSocialsOnChange } type="text" placeholder="Enter in your Facebook URL" />
                    </div>
                    <div className="form-group">
                        <label className="label" htmlFor="linkedin">Linkedin URL</label>
                        <input className="input" id="linkedin" name="linkedin" value={ linkedin } onChange={ handleSocialsOnChange } type="text" placeholder="Enter in your Linkedin URL" />
                    </div>
                    <div className="form-group">
                        <label className="label" htmlFor="twitter">Twitter URL</label>
                        <input className="input" id="twitter" name="twitter" value={ twitter } onChange={ handleSocialsOnChange } type="text" placeholder="Enter in your Twitter URL" />
                    </div>
                    <div className="form-group">
                        <button type="submit" className="button button--green form-group__submit">Update Socials</button>
                    </div>
                </form>
            </section>
        </Fragment>
    )
}

export default AccountSettings;
