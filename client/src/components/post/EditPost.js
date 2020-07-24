import React, { Fragment, useContext, useEffect, useState } from 'react';
import Loader from '../layouts/Loader';
import PostContext from '../../context/postContext/PostContext';
import placeholderUserImage from '../../assets/images/jade-hendricks.jpg';

const PostForm = ({ match }) => {

    const { getPost, editPost, post } = useContext(PostContext)

    const [values, setValues] = useState({ title: '', tag: '', description: ''});
    const { title, tag, description } = values;

    useEffect(() => {
        getPost(match.params.id)
    }, [match.params.id]);

    const handleOnChange = e => setValues({ ...values, [e.target.name]: e.target.value });

    const handleSubmit = e => {
        e.preventDefault();
        editPost(title, tag, description);
        setValues({ ...values, title: '', tag: '', description: '' });
    }

    return (
        <Fragment>
            { !post ? <Loader /> :  (
                <Fragment>
                    <div className="post">
                        <div className="post__banner post__banner--edit"></div>
                    </div>
                    <div className="create-post create-post--edit">
                        <div className="create-post__information">
                            <h1 className="create-post__title">Edit your blog post!</h1>
                            <p className="create-post__description">
                                Lorem ipsum dolor sit, amet consectetur adipisicing elit. 
                                Modi cupiditate minus adipisci aliquid dolor deleniti excepturi, 
                                nemo quisquam ea eos saepe quidem ipsum assumenda omnis.
                            </p>
                        </div>
                        <form className="form form--createPost" onSubmit={ handleSubmit }>
                            <div className="form__group">
                                <label className="form__label" htmlFor="title">Post Title</label>
                                <input className="form__input" id="title" onChange={ handleOnChange } value={ title } name="title" type="text" placeholder="Title goes here" />
                            </div>
                            <div className="form__group">
                                <label className="form__label" htmlFor="tag">Post Tag</label>
                                <select name="tag" id="tag" value={ tag} onChange={ handleOnChange } className="form__input">
                                    <option value="general">General</option>
                                    <option value="travel">Personal</option>
                                    <option value="funny">Funny</option>
                                </select>
                            </div>
                            <div className="form__group">
                                <label className="form__label" htmlFor="description">Post Body</label>
                                <textarea className="form__input form__textarea" onChange={ handleOnChange } value={ description } id="description" name="description" placeholder="Post goes here"></textarea>
                            </div>
                            <div className="form__group form__photo-upload">
                                <img className="form__user-photo" src={ placeholderUserImage } alt={ post.user.name } title={ post.user.name } />
                                <input className="form__upload" type="file" accept="image/*" id="photo" name="photo" />
                                <label htmlFor="photo">Choose a blog post image</label>
                            </div>
                            <div className="form__group">
                                <button className="button button--green">Update</button>
                            </div>
                        </form>
                    </div>
                </Fragment>
            )}
        </Fragment>
    )
}

export default PostForm;