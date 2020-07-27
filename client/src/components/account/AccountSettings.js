import React from 'react';
import placeholderUserImage from '../../assets/images/jade-hendricks.jpg';

const AccountSettings = () => {
    return (
        <section className="account-settings">
            <form className="form form--account">
                <div className="form__group">
                    <label className="form__label" htmlFor="name">Name</label>
                    <input className="form__input" id="name" name="name" type="text" placeholder="Name" />
                </div>
                <div className="form__group">
                    <label className="form__label" htmlFor="email">Email</label>
                    <input className="form__input" id="email" name="email" placeholder="yourname@example.com"></input>
                </div>
                <div className="form__group form__photo-upload">
                    <img className="form__user-photo" src={ placeholderUserImage } alt="User photo" />
                    <input className="form__upload" type="file" accept="image/*" id="photo" name="photo" />
                    <label htmlFor="photo">Choose a new profile picture</label>
                </div>
                <div className="form__group">
                    <button className="button button--green">Change details</button>
                </div>
            </form>
        </section>
    )
}

export default AccountSettings;
