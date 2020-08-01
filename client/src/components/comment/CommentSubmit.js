import React, { useState, useContext } from 'react';
import CommentPost from './CommentPost';
import { Link } from 'react-router-dom';
import AuthContext from '../../context/authContext/AuthContext';
import PostContext from '../../context/postContext/PostContext';

const CommentSubmit = ({ postId, postUser, comments }) => {
    const { isAuthenticated } = useContext(AuthContext);
    const { createComment } = useContext(PostContext);

    const [ comment, setComment] = useState('');
    
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
            { isAuthenticated  && (
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
            )}
            { comments && comments.map( comment => <CommentPost key={ comment._id } postId={ postId } postUser={ postUser } comment={ comment }/>) }
        </div>
    )
}

export default CommentSubmit;