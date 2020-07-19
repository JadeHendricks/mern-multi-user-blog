import React from 'react';
import { Link } from 'react-router-dom';

const CommentSubmit = () => {
    return (
        <div className="comment">
            <div className="comment__header">
                <h3 className="comment__title">Submit a comment</h3>
                <Link className="comment__auth" to='/login'>Not logged in? Log in to submit a comment</Link>
            </div>
            <form className="comment-form">
                <div className="form__group">
                    <textarea className="form__input form__textarea" placeholder="Comment..."></textarea>
                </div>
                <div className="form__group">
                    <button type="submit" className="button button--green">Submit comment</button>
                </div>
                <div className="form__group">
                    <span className="comment__total">2 Comments</span>
                </div>
            </form>
        </div>
    )
}

export default CommentSubmit;