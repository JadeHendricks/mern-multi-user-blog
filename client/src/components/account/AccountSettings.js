import React from 'react'

const AccountSettings = () => {
    return (
        <section className="account-settings">
            <form className="form form--account">
                <h2 className="account-settings__title">Your account settings</h2>
                <div className="form__group">
                    <label className="form__label" for="name">Name</label>
                    <input className="form__input" id="name" name="name" type="text" placeholder="Name" />
                </div>
                <div className="form__group">
                    <label className="form__label" for="email">Email</label>
                    <input className="form__input" id="email" name="email" placeholder="yourname@example.com"></input>
                </div>
                <div className="form__group form__photo-upload">
                    <img className="form__user-photo" src="./images/jade-hendricks.jpg" alt="User photo" />
                    <input className="form__upload" type="file" accept="image/*" id="photo" name="photo" />
                    <label for="photo">Choose a new profile picture</label>
                </div>
                <div className="form__group">
                    <button className="button button--green">Change details</button>
                </div>
            </form>
        </section>
    )
}

export default AccountSettings;
