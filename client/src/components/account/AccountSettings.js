import React, { Fragment, useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import placeholderUserImage from '../../assets/images/jade-hendricks.jpg';

const AccountSettings = ({ user: { _id, name, email, socials } }) => {

    const [ userSocials, setUserSocials] = useState({ facebook: '', linkedin: '', twitter: '' });
    const {facebook, linkedin, twitter} = userSocials;
    const handleSocialsOnChange = e => setUserSocials({ ...userSocials, [e.target.name]: e.target.value });

    const updateUserSocials = async (facebook, linkedin, twitter) => {
        const config = { headers: {'Content-Type': 'application/json'} };
        const body = JSON.stringify({ facebook, linkedin, twitter });
        try {
            const res = await axios.put(`/api/user/${_id}/socials`, body, config);
            toast.success(res.data.message);
        } catch (err) {
            console.log(err.response.message);
        }
    }

    const handleSocialSubmit = e => {
        e.preventDefault();
        updateUserSocials(facebook, linkedin, twitter);
    }

    useEffect(() => {
        setUserSocials({
            facebook: socials.facebook,
            twitter: socials.twitter,
            linkedin: socials.linkedin
        });
    }, []);
    
    return (
        <Fragment>
            <section className="account-settings">
                <form className="form form--account">
                    <div className="form__group">
                        <label className="form__label" htmlFor="name">Name</label>
                        <input className="form__input" id="name" value={ name } name="name" type="text" placeholder="Name" />
                    </div>
                    <div className="form__group">
                        <label className="form__label" htmlFor="email">Email</label>
                        <input className="form__input" id="email" value={ email } name="email" placeholder="yourname@example.com"></input>
                    </div>
                    <div className="form__group form__photo-upload">
                        <img className="form__user-photo" src={ placeholderUserImage } alt="User photo" />
                        <input className="form__upload" type="file" accept="image/*" id="photo" name="photo" />
                        <label htmlFor="photo">Choose a new profile picture</label>
                    </div>
                    <div className="form__group">
                        <button type="submit" className="button button--green">Update Account</button>
                    </div>
                </form>
            </section>

            <h2 className="account__view-title">Socials</h2>
            
            <section className="account-settings">
                <form className="form form--account" onSubmit={ handleSocialSubmit }>
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
    )
}

export default AccountSettings;
