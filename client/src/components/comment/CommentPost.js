import React, { useContext } from 'react';
import axios from 'axios';
import Moment from 'react-moment';
import { toast } from 'react-toastify';
import AuthContext from '../../context/authContext/AuthContext';
import placeholderUserImage from '../../assets/images/jade-hendricks.jpg';

const CommentPost = ({ comment: { user, comment, name, date, _id }, postId }) => {
    const { loggedInUser } = useContext(AuthContext);

    const isUsersData = () => {
        if (loggedInUser && user) {
            return loggedInUser._id === user;
        }
    }

    const deleteComment = async (postId, commentId) => {
        try {
            await axios.delete(`/api/post/comment/${postId}/${commentId}`);
            toast.success('Comment deleted')
        } catch (err) {
            console.log(err.reponse.message)
        }
    }

    return (
        <div className="comment-post">
            <div className="comment-post__icon">
                <img src={ placeholderUserImage } alt={ name } title={ name } />
            </div>
            <div className="comment-post__information">
                <h5 className="comment-post__user-name">{ name } <span><Moment format="DD/MM/YYYY">{ date }</Moment></span></h5>
                <p className="comment-post__user-comment">
                    { comment }
                </p>
            </div>
            { isUsersData() && (
                <div className="comment-post__interaction">
                    <button className="button button--red" onClick={ () => deleteComment(postId, _id) }>Delete Comment</button>  
                </div>
            ) }

        </div>
    )
}

export default CommentPost;