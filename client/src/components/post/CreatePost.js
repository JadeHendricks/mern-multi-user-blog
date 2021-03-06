import React, { Fragment, useContext, useState } from 'react';
import PostContext from '../../context/postContext/PostContext';
import noImageFound from '../../assets/images/posts/default.jpg';

const PostForm = () => {
    const { createPost } = useContext(PostContext);
    
    const [values, setValues] = useState({ title: '', tag: '', description: ''});
    const { title, tag, description } = values;

    const [ image, setImage] = useState();
    const [ uploadName, setUploadName] = useState();

    const handleOnChange = e => setValues({ ...values, [e.target.name]: e.target.value });

    const handleSubmit = e => {
        e.preventDefault();
        createPost(title, tag, description, image);
    }

    return (
        <Fragment>
            <div className="post">
                <div className="post__banner"></div>
            </div>
            <div className="container">
                <div className="create-post">
                    <div className="create-post__information">
                        <h1 className="create-post__title">Create a blog post!</h1>
                        <p className="create-post__description">
                            Lorem ipsum dolor sit, amet consectetur adipisicing elit. 
                            Modi cupiditate minus adipisci aliquid dolor deleniti excepturi, 
                            nemo quisquam ea eos saepe quidem ipsum assumenda omnis.
                        </p>
                    </div>
                    <form className="form form--createPost" onSubmit={ (e) => handleSubmit(e) }>
                        <div className="form__group">
                            <label className="form__label" htmlFor="title">Post Title</label>
                            <input className="form__input" id="title" onChange={ handleOnChange } name="title" type="text" placeholder="Title goes here" />
                        </div>
                        <div className="form__group">
                            <label className="form__label" htmlFor="tag">Post Tag</label>
                            <div className="form__radio">
                                { tag && tag === 'general' ? <input type="radio" id="general" value="general" name="tag" onChange={ handleOnChange } checked={tag && tag === 'general'} /> :
                                <input type="radio" id="general" value="general" name="tag" onChange={ handleOnChange } checked />}
                                
                                <label htmlFor="general" className="form__radio-label">general</label>
                            </div>
                            <div className="form__radio">
                                <input type="radio" id="travel" value="travel" name="tag" onChange={ handleOnChange } checked={tag && tag === 'travel'} />
                                <label htmlFor="travel" className="form__radio-label">travel</label>
                            </div>
                            <div className="form__radio">
                                <input type="radio" id="funny" value="funny" name="tag" onChange={ handleOnChange } checked={tag && tag === 'funny'} />
                                <label htmlFor="funny" className="form__radio-label">funny</label>
                            </div>
                        </div>
                        <div className="form__group">
                            <label className="form__label" htmlFor="description">Post Body</label>
                            <textarea className="form__input form__textarea" onChange={ handleOnChange } id="description" name="description" placeholder="Post goes here"></textarea>
                        </div>
                        <div className="form__group form__photo-upload">
                            <img className="form__user-photo" src={ noImageFound } alt="Something could be here" title="Something could be here" />
                            <input className="form__upload" type="file" accept="image/*" id="image" name="image" onChange={ e => {
                                const file = e.target.files[0];
                                setImage(file);
                                setUploadName(e.target.value.slice(12));
                            } } />
                            <label htmlFor="image">{ uploadName ? uploadName : 'Choose a blog post image' }</label>
                        </div>
                        <div className="form__group">
                            <button className="button button--green">Create Post</button>
                        </div>
                    </form>
                </div>
            </div>
        </Fragment>
    )
}

export default PostForm;