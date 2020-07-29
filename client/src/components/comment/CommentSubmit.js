import React, { useState } from 'react';
import axios from 'axios';
import CommentPost from './CommentPost';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';

const CommentSubmit = ({ postId, postUser, comments }) => {

    const [ comment, setComment] = useState('');

    const createComment = (id, comment) => {
        const config = { headers: {'Content-Type': 'application/json'} };
        const body = JSON.stringify(comment);
        try {
            axios.post(`/api/post/comment/${id}`, body, config);
            toast.success('Comment added');
        } catch (err) {
            console.log(err.response.message);
        }
    }

    const handleOnChange = e => setComment({ ...comment, [e.target.name]: e.target.value });

    const handleSubmit = e => {
        e.preventDefault();
        createComment(postId, comment);
    }

    return (
        <div className="comment">
            <div className="comment__header">
                <h3 className="comment__title">Submit a comment</h3>
                <Link className="comment__auth" to='/login'>Not logged in? Log in to submit a comment</Link>
            </div>
            <form className="comment-form" onSubmit={ handleSubmit }>
                <div className="form__group">
                    <textarea id="comment" name="comment" className="form__input form__textarea" onChange={ handleOnChange } placeholder="Comment..."></textarea>
                </div>
                <div className="form__group">
                    <button type="submit" className="button button--green">Submit comment</button>
                </div>
                <div className="form__group">
                    <span className="comment__total">{ comments && comments.length } Comments</span>
                </div>
            </form>
            { comments && comments.map( comment => <CommentPost key={ comment._id } postId={ postId } postUser={ postUser } comment={ comment }/>) }
        </div>
    )
}

export default CommentSubmit;