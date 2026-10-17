import React, { useContext } from 'react';
import Moment from 'react-moment';
import AuthContext from '../../context/authContext/AuthContext';
import { useDeleteComment } from '../../hooks/useDeleteComment';
import { uploadUrl, onImageError } from '../../utils/imageUrl';
const CommentPost = ({ comment: { userId, avatar, comment, name, date, _id }, postId }) => {
    const { loggedInUser, isUsersData } = useContext(AuthContext);
    const deleteComment = useDeleteComment(postId);
    return (
        <div className="comment-post">
            <div className="comment-post__icon">
                <img src={ uploadUrl('users', avatar) } onError={ onImageError('users') } alt={ name } title={ name } />
            </div>
            <div className="comment-post__information">
                <h5 className="comment-post__user-name">{ name } <span><Moment format="DD/MM/YYYY">{ date }</Moment></span></h5>
                <p className="comment-post__user-comment">
                    { comment }
                </p>
            </div>
            { loggedInUser && isUsersData(loggedInUser._id, userId) && (
                <div className="comment-post__interaction">
                    <button className="button button--red" onClick={ () => deleteComment.mutate(_id) }>Delete Comment</button>
                </div>
            ) }
        </div>
    )
}
export default CommentPost;
