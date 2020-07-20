import React, { Fragment } from 'react';

const PostForm = () => {
    return (
        <Fragment>
            <div className="post">
                <div className="post__banner"></div>
            </div>
            <div className="create-post">
                <div className="create-post__information">
                    <h1 className="create-post__title">Create a blog post!</h1>
                    <p className="create-post__description">
                        Lorem ipsum dolor sit, amet consectetur adipisicing elit. 
                        Modi cupiditate minus adipisci aliquid dolor deleniti excepturi, 
                        nemo quisquam ea eos saepe quidem ipsum assumenda omnis.
                    </p>
                </div>
                <form className="form form--createPost">
                    <div className="form__group">
                        <label className="form__label" htmlFor="title">Post Title</label>
                        <input className="form__input" id="title" name="title" type="text" placeholder="Title goes here" />
                    </div>
                    <div className="form__group">
                        <label className="form__label" htmlFor="tag">Post Tag</label>
                        <select name="tag" id="tag" className="form__input">
                            <option value="general" selected>General</option>
                            <option value="travel">Personal</option>
                            <option value="funny">Funny</option>
                        </select>
                    </div>
                    <div className="form__group">
                        <label className="form__label" htmlFor="body">Post Body</label>
                        <textarea className="form__input form__textarea" id="body" name="body" placeholder="Post goes here"></textarea>
                    </div>
                    <div className="form__group form__photo-upload">
                        <img className="form__user-photo" src="./images/jade-hendricks.jpg" alt="User photo" />
                        <input className="form__upload" type="file" accept="image/*" id="photo" name="photo" />
                        <label htmlFor="photo">Choose a blog post image</label>
                    </div>
                    <div className="form__group">
                        <button className="button button--green">Post</button>
                    </div>
                </form>
            </div>
        </Fragment>
    )
}

export default PostForm;