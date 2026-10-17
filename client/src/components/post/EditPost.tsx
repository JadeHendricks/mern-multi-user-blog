import { Fragment, useState } from 'react';
import type { ChangeEvent, SubmitEvent } from 'react';
import type { PostWithAuthor } from '../../lib/types';
import { useParams } from 'react-router';
import { uploadUrl, onImageError } from '../../utils/imageUrl';
import { usePost } from '../../hooks/usePost';
import { useEditPost } from '../../hooks/useEditPost';

interface PostEditFormProps {
    id: string;
    post: PostWithAuthor | undefined;
}

// The form starts from the saved post through lazy state, so there is no effect that resets and
// refills it. The key restarts the form for another post, and again when the post arrives.
const PostEditForm = ({ id, post }: PostEditFormProps) => {
    const editPost = useEditPost(id);
    const [ values, setValues ] = useState(() => ({
        image: post?.image ?? '',
        title: post?.title ?? '',
        tag: post?.tag ?? '',
        description: post?.description ?? ''
    }));
    const { image, title, tag, description } = values;
    const [ blogimage, setBlogImage] = useState<File | undefined>();
    const [ uploadName, setUploadName] = useState('');
    const handleOnChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => { setValues({ ...values, [e.target.name]: e.target.value }); };
    const handleSubmit = (e: SubmitEvent<HTMLFormElement>) => {
        e.preventDefault();
        editPost.mutate({ title, tag, description, image: blogimage });
    }
    return (
        <form className="form form--post" onSubmit={ handleSubmit }>
            <div className="form-group">
                <label className="label" htmlFor="title">Post Title</label>
                <input className="input" id="title" onChange={ handleOnChange } value={ title } name="title" type="text" placeholder="Title goes here" />
            </div>
            {/* No single input owns this label (the tag is a radio group), so it names the group instead. */}
            <div className="form-group" role="radiogroup" aria-labelledby="post-tag-label">
                <span className="label" id="post-tag-label">Post Tag</span>
                <div className="radio">
                    <input className="radio__input" type="radio" id="general" value="general" name="tag" onChange={ handleOnChange } checked={tag === 'general'} />
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
                <textarea className="input input--textarea" onChange={ handleOnChange } value={ description } id="description" name="description" placeholder="Post goes here"></textarea>
            </div>
            <div className="form-group form-group--upload">
                <img className="avatar file-upload__photo" src={ uploadUrl('posts', image) } onError={ onImageError('posts') } alt={ title } title={ title } />
                <input className="file-upload__input" type="file" accept="image/*" id="blogimage" name="blogimage" onChange={ e => {
                    const file = e.target.files?.[0];
                    setBlogImage(file);
                    setUploadName(e.target.value.slice(12));
                } } />
                <label className="file-upload__label" htmlFor="blogimage">{ uploadName ? uploadName : 'Choose a blog post image' }</label>
            </div>
            <div className="form-group">
                <button className="button button--green form-group__submit">Update Post</button>
            </div>
        </form>
    )
}

const PostForm = () => {
    // The route always has :id; the empty default only satisfies the types.
    const { id = '' } = useParams();
    const { data: post } = usePost(id);
    return (
        <Fragment>
            <div className="post">
                <div className="post__banner post__banner--edit"></div>
            </div>
            <div className="container">
                <div className="create-post create-post--edit">
                    <div>
                        <h1 className="create-post__title">Edit your blog post!</h1>
                        <p className="create-post__description">
                            Lorem ipsum dolor sit, amet consectetur adipisicing elit. 
                            Modi cupiditate minus adipisci aliquid dolor deleniti excepturi, 
                            nemo quisquam ea eos saepe quidem ipsum assumenda omnis.
                        </p>
                    </div>
                    <PostEditForm key={ `${id}:${post ? 'loaded' : 'loading'}` } id={ id } post={ post } />
                </div>
            </div>
        </Fragment>
    )
}
export default PostForm;
