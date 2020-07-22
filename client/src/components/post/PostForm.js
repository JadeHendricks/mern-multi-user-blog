import React, { Fragment, useContext, useState } from 'react';
import PostContext from '../../context/postContext/PostContext';

const PostForm = () => {

    const { createPost } = useContext(PostContext)

    const [values, setValues] = useState({ title: '', tag: '', description: ''});
    const { title, tag, description } = values;

    const handleOnChange = e => setValues({ ...values, [e.target.name]: e.target.value });

    const handleSubmit = e => {
        e.preventDefault();
        createPost(title, tag, description);
        setValues({ ...values, title: '', tag: '', description: '' });
    }

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
                <form className="form form--createPost" onSubmit={ handleSubmit }>
                    <div className="form__group">
                        <label className="form__label" htmlFor="title">Post Title</label>
                        <input className="form__input" id="title" onChange={ handleOnChange } name="title" type="text" placeholder="Title goes here" />
                    </div>
                    <div className="form__group">
                        <label className="form__label" htmlFor="tag">Post Tag</label>
                        <select name="tag" id="tag" onChange={ handleOnChange } className="form__input">
                            <option value="general" defaultValue>General</option>
                            <option value="travel">Personal</option>
                            <option value="funny">Funny</option>
                        </select>
                    </div>
                    <div className="form__group">
                        <label className="form__label" htmlFor="description">Post Body</label>
                        <textarea className="form__input form__textarea" onChange={ handleOnChange } id="description" name="description" placeholder="Post goes here"></textarea>
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