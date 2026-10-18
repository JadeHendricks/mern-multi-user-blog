import type { CommentDto } from '@mern-blog/shared';
import { formatDate } from '../../lib/formatDate';
import { useAuth } from '../../context/authContext/AuthContext';
import { useDeleteComment } from '../../hooks/useDeleteComment';
import { uploadUrl, onImageError } from '../../utils/imageUrl';
interface CommentPostProps {
    comment: CommentDto;
    postId: string;
}

const CommentPost = ({ comment: { userId, avatar, comment, name, date, _id }, postId }: CommentPostProps) => {
    const { loggedInUser, isUsersData } = useAuth();
    const deleteComment = useDeleteComment(postId);
    return (
        <div className="comment-post">
            <div className="comment-post__icon">
                <img className="avatar comment-post__avatar" src={ uploadUrl('users', avatar) } onError={ onImageError('users') } alt={ name } title={ name } />
            </div>
            <div className="comment-post__information">
                <h5 className="comment-post__user-name">{ name } <span className="comment-post__date">{ formatDate(date) }</span></h5>
                <p className="comment-post__user-comment">
                    { comment }
                </p>
            </div>
            { loggedInUser && isUsersData(loggedInUser._id, userId) && (
                <div className="comment-post__interaction">
                    <button className="button button--link-red" onClick={ () => { deleteComment.mutate(_id); } }>Delete Comment</button>
                </div>
            ) }
        </div>
    )
}
export default CommentPost;
