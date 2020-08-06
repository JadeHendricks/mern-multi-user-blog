import React, { Fragment, useEffect, useContext, useState } from 'react';
import UserContext from '../../context/userContext/UserContext';
import ContentLoader from '../layouts/ContentLoader';

const AccountSettings = ({ user }) => {
    const { updateUserSocials, updateUser, userLoading } = useContext(UserContext);

    const [ userSocials, setUserSocials] = useState({ facebook: '', linkedin: '', twitter: '' });
    const handleSocialsOnChange = e => setUserSocials({ ...userSocials, [e.target.name]: e.target.value });
    const {facebook, linkedin, twitter} = userSocials;

    const [ name, setName] = useState();
    const [ avatar, setAvatar] = useState();
    const [ uploadName, setUploadName] = useState();

    useEffect(() => {
        if (user.socials) {
            setUserSocials({
                facebook: user.socials.facebook || '',
                twitter: user.socials.twitter || '',
                linkedin: user.socials.linkedin || ''
            });
        }
        setName(user.name);
    }, []);
    
    return (
        <Fragment>
            { userLoading ? (<ContentLoader />) : (
                <Fragment>
                    <section className="account-settings">
                        <form className="form form--account" onSubmit={ (e) => {
                            e.preventDefault();
                            updateUser(name, avatar);
                        } }>
                            <div className="form__group">
                                <label className="form__label" htmlFor="name">Name</label>
                                <input className="form__input" id="name" value={ name } onChange={ e => {
                                    const value = e.target.value;
                                    setName(value);
                                } } name="name" type="text" placeholder="Name" />
                            </div>
                            <div className="form__group">
                                <label className="form__label" htmlFor="email">Email</label>
                                <input className="form__input" id="email" name="email" value={ user.email } placeholder="yourname@example.com" disabled></input>
                            </div>
                            <div className="form__group form__photo-upload">
                                { user.avatar && ( <img className="form__user-photo" src={require(`../../assets/images/users/${user.avatar}`)} alt={ user.name } title={ user.name } />) }
                                <input className="form__upload" type="file" accept="image/*" id="avatar" name="avatar" onChange={ e => {
                                    const file = e.target.files[0];
                                    setAvatar(file);
                                    setUploadName(e.target.value.slice(12));
                                } } />
                                <label htmlFor="avatar">{ uploadName ? uploadName : 'Choose a new profile picture'}</label>
                            </div>
                            <div className="form__group">
                                <button type="submit" className="button button--green">Update Account</button>
                            </div>
                        </form>
                    </section>

                    <h2 className="account__view-title">Socials</h2>
                    
                    <section className="account-settings">
                        <form className="form form--account" onSubmit={ (e) => {
                            e.preventDefault();
                            updateUserSocials(facebook, linkedin, twitter, user._id) }
                            }>
                            <div className="form__group">
                                <label className="form__label" htmlFor="facebook">Facebook URL</label>
                                <input className="form__input" id="facebook" name="facebook" value={ facebook } onChange={ handleSocialsOnChange } type="text" placeholder="Enter in your Facebook URL" />
                            </div>
                            <div className="form__group">
                                <label className="form__label" htmlFor="linkedin">Linkedin URL</label>
                                <input className="form__input" id="linkedin" name="linkedin" value={ linkedin } onChange={ handleSocialsOnChange } type="text" placeholder="Enter in your Linkedin URL" />
                            </div>
                            <div className="form__group">
                                <label className="form__label" htmlFor="twitter">Twitter URL</label>
                                <input className="form__input" id="twitter" name="twitter" value={ twitter } onChange={ handleSocialsOnChange } type="text" placeholder="Enter in your Twitter URL" />
                            </div>
                            <div className="form__group">
                                <button type="submit" className="button button--green">Update Socials</button>
                            </div>
                        </form>
                    </section>
                </Fragment>
            ) }
        </Fragment>
    )
}

export default AccountSettings;
