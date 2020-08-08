import React, { Fragment, useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import PostContext from '../../context/postContext/PostContext';

const PostForm = ({ match }) => {
    const { editPost } = useContext(PostContext);
    const [ values, setValues ] = useState({ image: '', title: '', tag: '', description: ''});
    const { image, title, tag, description } = values;

    const [ blogimage, setBlogImage] = useState();
    const [ uploadName, setUploadName] = useState();

    const getPost = async (id) => {
        try {
            const res = await axios.get(`/api/post/${id}`);
            setValues({ 
                image: res.data.post.image,
                title: res.data.post.title, 
                tag: res.data.post.tag, 
                description: res.data.post.description
            });
        } catch (err) {
            console.log(err.response.data.message);
            toast.error(err.response.data.message);
        }
    }

    useEffect(() => {
        setValues({ title: '', tag: '', description: '', user: ''});
        getPost(match.params.id);
    }, [match.params.id]);

    const handleOnChange = e => setValues({ ...values, [e.target.name]: e.target.value });

    const handleSubmit = e => {
        e.preventDefault();
        editPost(match.params.id, title, tag, description, blogimage);
    }

    return (
        <Fragment>
            <div className="post">
                <div className="post__banner post__banner--edit"></div>
            </div>
            <div className="container">
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
                            <div className="form__radio">
                                <input type="radio" id="general" value="general" name="tag" onChange={ handleOnChange } checked={tag && tag === 'general'} />
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
                            <textarea className="form__input form__textarea" onChange={ handleOnChange } value={ description } id="description" name="description" placeholder="Post goes here"></textarea>
                        </div>
                        <div className="form__group form__photo-upload">
                            { image && title && (
                                <img className="form__user-photo" src={require(`../../assets/images/posts/${image}`)} alt={ title } title={ title } />
                            )}
                            <input className="form__upload" type="file" accept="image/*" id="blogimage" name="blogimage" onChange={ e => {
                                const file = e.target.files[0];
                                setBlogImage(file);
                                setUploadName(e.target.value.slice(12));
                            } } />
                            <label htmlFor="blogimage">{ uploadName ? uploadName : 'Choose a blog post image' }</label>
                        </div>
                        <div className="form__group">
                            <button className="button button--green">Update Post</button>
                        </div>
                    </form>
                </div>
            </div>
        </Fragment>
    )
}

export default PostForm;