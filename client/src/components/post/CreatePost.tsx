import { Fragment, useState } from 'react';
import type { ChangeEvent, SubmitEvent } from 'react';
import { useCreatePost } from '../../hooks/useCreatePost';
import noImageFound from '../../assets/images/posts/default.jpg';

const PostForm = () => {
    const createPost = useCreatePost();
    
    const [values, setValues] = useState({ title: '', tag: '', description: ''});
    const { title, tag, description } = values;

    const [ image, setImage] = useState<File | undefined>();
    const [ uploadName, setUploadName] = useState('');

    const handleOnChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => { setValues({ ...values, [e.target.name]: e.target.value }); };

    const handleSubmit = (e: SubmitEvent<HTMLFormElement>) => {
        e.preventDefault();
        createPost.mutate({ title, tag, description, image });
    }

    return (
        <Fragment>
            <div className="post">
                <div className="post__banner"></div>
            </div>
            <div className="container">
                <div className="create-post">
                    <div>
                        <h1 className="create-post__title">Create a blog post!</h1>
                        <p className="create-post__description">
                            Share a story, a trip or something funny. Give it a title, pick a tag and add a photo if you have one.
                        </p>
                    </div>
                    <form className="form form--post" onSubmit={ handleSubmit }>
                        <div className="form-group">
                            <label className="label" htmlFor="title">Post Title</label>
                            <input className="input" id="title" onChange={ handleOnChange } name="title" type="text" placeholder="Title goes here" />
                        </div>
                        {/* No single input owns this label (the tag is a radio group), so it names the group instead. */}
                        <div className="form-group" role="radiogroup" aria-labelledby="post-tag-label">
                            <span className="label" id="post-tag-label">Post Tag</span>
                            <div className="radio">
                                {/* Always checked: both branches of the old ternary rendered checked=true. */}
                                <input className="radio__input" type="radio" id="general" value="general" name="tag" onChange={ handleOnChange } checked />
                                
                                <label htmlFor="general" className="radio__label">general</label>
                            </div>
                            <div className="radio">
                                <input className="radio__input" type="radio" id="travel" value="travel" name="tag" onChange={ handleOnChange } checked={tag === 'travel'} />
                                <label htmlFor="travel" className="radio__label">travel</label>
                            </div>
                            <div className="radio">
                                <input className="radio__input" type="radio" id="funny" value="funny" name="tag" onChange={ handleOnChange } checked={tag === 'funny'} />
                                <label htmlFor="funny" className="radio__label">funny</label>
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="label" htmlFor="description">Post Body</label>
                            <textarea className="input input--textarea" onChange={ handleOnChange } id="description" name="description" placeholder="Post goes here"></textarea>
                        </div>
                        <div className="form-group form-group--upload">
                            <img className="avatar file-upload__photo" src={ noImageFound } alt="" />
                            <input className="file-upload__input" type="file" accept="image/*" id="image" name="image" onChange={ e => {
                                const file = e.target.files?.[0];
                                setImage(file);
                                setUploadName(e.target.value.slice(12));
                            } } />
                            <label className="file-upload__label" htmlFor="image">{ uploadName ? uploadName : 'Choose a blog post image' }</label>
                        </div>
                        <div className="form-group">
                            <button className="button button--green form-group__submit">Create Post</button>
                        </div>
                    </form>
                </div>
            </div>
        </Fragment>
    )
}

export default PostForm;