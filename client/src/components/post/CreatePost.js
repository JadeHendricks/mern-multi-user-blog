import React, { Fragment, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import placeholderUserImage from '../../assets/images/jade-hendricks.jpg';

const PostForm = () => {
    const [values, setValues] = useState({ title: '', tag: '', description: ''});
    const { title, tag, description } = values;

    const [ image, setImage] = useState();

    const createPost = async (title, tag, description, image) => { 
        const config = { headers: {'Content-Type': 'application/json'} };
        const body = new FormData();
        body.append('title', title);
        body.append('tag', tag);
        body.append('description', description);
        body.append('image', image);
        try {
            const res = await axios.post('/api/post', body, config);
            toast.success(res.data.message);
        } catch (err) {
            console.log(err.response.message);
        }
    }

    const handleOnChange = e => setValues({ ...values, [e.target.name]: e.target.value });

    const handleSubmit = e => {
        e.preventDefault();
        createPost(title, tag, description, image);
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
                        <input type="radio" value="general" name="tag" onChange={ handleOnChange } checked={tag && tag === 'general'} /> general
                        <input type="radio" value="travel" name="tag" onChange={ handleOnChange } checked={tag && tag === 'travel'} /> travel
                        <input type="radio" value="funny" name="tag" onChange={ handleOnChange } checked={tag && tag === 'funny'} /> Funny
                    </div>
                    <div className="form__group">
                        <label className="form__label" htmlFor="description">Post Body</label>
                        <textarea className="form__input form__textarea" onChange={ handleOnChange } id="description" name="description" placeholder="Post goes here"></textarea>
                    </div>
                    <div className="form__group form__photo-upload">
                        <img className="form__user-photo" src={ placeholderUserImage } alt="User photo" />
                        <input className="form__upload" type="file" accept="image/*" id="image" name="image" onChange={ e => {
                            const file = e.target.files[0];
                            setImage(file);
                        } } />
                        <label htmlFor="image">Choose a blog post image</label>
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