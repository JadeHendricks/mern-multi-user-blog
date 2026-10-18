import React, { useState, useContext } from 'react';
import CommentPost from './CommentPost';
import { Link } from 'react-router';
import AuthContext from '../../context/authContext/AuthContext';
import { useAddComment } from '../../hooks/useAddComment';
const CommentSubmit = ({ postId, postUser, comments }) => {
    const { isAuthenticated } = useContext(AuthContext);
    const addComment = useAddComment(postId);
    const [ comment, setComment] = useState('');
    const handleOnChange = e => setComment(e.target.value);
    const handleSubmit = e => {
        e.preventDefault();
        // The API expects { comment }; clear the box only after it was saved.
        addComment.mutate(comment, { onSuccess: () => setComment('') });
    }
    return (
        <div className="comment">
            <div className="comment__header">
                <h3 className="comment__title">Submit a comment</h3>
                { !isAuthenticated && (
                    <Link className="comment__auth" to='/login'>Not logged in? Log in to submit a comment</Link>
                ) }
            </div>
            { isAuthenticated && (
                <form className="comment-form" onSubmit={ handleSubmit }>
                    <div className="form__group">
                        <textarea id="comment" name="comment" className="form__input form__textarea" value={ comment } onChange={ handleOnChange } placeholder="Comment..."></textarea>
                    </div>
                    <div className="form__group">
                        <button type="submit" className="button button--green">Submit comment</button>
                    </div>
                    <div className="form__group">
                        <span className="comment__total">{ comments?.length } { comments?.length === 1 ? 'Comment' : 'Comments'}</span>
                    </div>
                </form>
            )}
            { comments?.map( comment => <CommentPost key={ comment._id } postId={ postId } postUser={ postUser } comment={ comment }/>) }
        </div>
    )
}
export default CommentSubmit;
