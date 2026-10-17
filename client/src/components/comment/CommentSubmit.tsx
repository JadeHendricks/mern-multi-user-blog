import { useState } from 'react';
import type { ChangeEvent, SubmitEvent } from 'react';
import type { CommentDto } from '@mern-blog/shared';
import CommentPost from './CommentPost';
import { Link } from 'react-router';
import { useAuth } from '../../context/authContext/AuthContext';
import { useAddComment } from '../../hooks/useAddComment';
interface CommentSubmitProps {
    postId: string;
    // Undefined while the post page has no post yet (it renders the empty frame).
    comments: CommentDto[] | undefined;
}

const CommentSubmit = ({ postId, comments }: CommentSubmitProps) => {
    const { isAuthenticated } = useAuth();
    const addComment = useAddComment(postId);
    const [ comment, setComment] = useState('');
    const handleOnChange = (e: ChangeEvent<HTMLTextAreaElement>) => { setComment(e.target.value); };
    const handleSubmit = (e: SubmitEvent<HTMLFormElement>) => {
        e.preventDefault();
        // The API expects { comment }; clear the box only after it was saved.
        addComment.mutate(comment, { onSuccess: () => { setComment(''); } });
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
                    <div className="form-group">
                        <textarea id="comment" name="comment" className="input input--textarea" value={ comment } onChange={ handleOnChange } placeholder="Comment..."></textarea>
                    </div>
                    <div className="form-group">
                        <button type="submit" className="button button--green form-group__submit">Submit comment</button>
                    </div>
                    <div className="form-group">
                        <span className="comment__total">{ comments?.length } { comments?.length === 1 ? 'Comment' : 'Comments'}</span>
                    </div>
                </form>
            )}
            { comments?.map( comment => <CommentPost key={ comment._id } postId={ postId } comment={ comment }/>) }
        </div>
    )
}
export default CommentSubmit;
