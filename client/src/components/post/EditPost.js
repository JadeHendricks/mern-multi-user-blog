import React, { Fragment, useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const PostForm = ({ match, history }) => {
    const [values, setValues] = useState({ title: '', tag: '', description: '', user: ''});
    const { title, tag, description, user } = values;

    const [ image, setImage] = useState();

    const getPost = async (id) => {
        try {
            const res = await axios.get(`/api/post/${id}`);
            setValues({ 
                title: res.data.post.title, 
                tag: res.data.post.tag, 
                description: res.data.post.description,
                user: res.data.post.user,
            });
        } catch (err) {
            console.log(err.response.message);
        }
    }

    const editPost = async (id, title, tag, description, image) => { 
        const config = { headers: {'Content-Type': 'application/json'} };
        const body = new FormData();
        body.append('id', id);
        body.append('title', title);
        body.append('tag', tag);
        body.append('description', description);
        body.append('image', image);
        try {
            const res = await axios.put(`/api/post/${id}`, body, config);        
            toast.success(res.data.message);
            history.push(`/post/${id}`);
        } catch (err) {
            console.log(err.response.message);
        }
    }

    useEffect(() => {
        getPost(match.params.id);
    }, [match.params.id]);

    const handleOnChange = e => setValues({ ...values, [e.target.name]: e.target.value });

    const handleSubmit = e => {
        e.preventDefault();
        editPost(match.params.id, title, tag, description, image);
        setValues({ title: '', tag: '', description: '', user: ''});
    }

    return (
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
                        <div class="form__radio">
                            <input type="radio" id="general" value="general" name="tag" onChange={ handleOnChange } checked={tag && tag === 'general'} />
                            <label for="general" className="form__radio-label">general</label>
                        </div>
                        <div class="form__radio">
                            <input type="radio" id="travel" value="travel" name="tag" onChange={ handleOnChange } checked={tag && tag === 'travel'} />
                            <label for="travel" className="form__radio-label">travel</label>
                        </div>
                        <div class="form__radio">
                            <input type="radio" id="funny" value="funny" name="tag" onChange={ handleOnChange } checked={tag && tag === 'funny'} />
                            <label for="funny" className="form__radio-label">funny</label>
                        </div>
                    </div>
                    <div className="form__group">
                        <label className="form__label" htmlFor="description">Post Body</label>
                        <textarea className="form__input form__textarea" onChange={ handleOnChange } value={ description } id="description" name="description" placeholder="Post goes here"></textarea>
                    </div>
                    <div className="form__group form__photo-upload">
                        { user.avatar && (
                            <img className="form__user-photo" src={require(`../../assets/images/users/${user.avatar}`)} alt={ user.name } title={ user.name } />
                        )}
                        <input className="form__upload" type="file" accept="image/*" id="image" name="image" onChange={ e => {
                            const file = e.target.files[0];
                            setImage(file);
                        } } />
                        <label htmlFor="image">Choose a blog post image</label>
                    </div>
                    <div className="form__group">
                        <button className="button button--green">Update</button>
                    </div>
                </form>
            </div>
        </Fragment>
    )
}

export default PostForm;