import React, { useContext, Fragment } from 'react';
import Moment from 'react-moment';
import AuthContext from '../../context/authContext/AuthContext';
import PostContext from '../../context/postContext/PostContext';
import ContentLoader from '../layouts/ContentLoader';

const CommentPost = ({ comment: { userId, avatar, comment, name, date, _id }, postId }) => {
    const { loggedInUser, isUsersData, authLoader } = useContext(AuthContext);
    const { deleteComment, postLoader } = useContext(PostContext);

    return (
        <Fragment>
            { authLoader && postLoader ? (<ContentLoader />) : (
                <div className="comment-post">
                    <div className="comment-post__icon">
                        <img src={require(`../../assets/images/users/${avatar}`)} alt={ name } title={ name } />
                    </div>
                    <div className="comment-post__information">
                        <h5 className="comment-post__user-name">{ name } <span><Moment format="DD/MM/YYYY">{ date }</Moment></span></h5>
                        <p className="comment-post__user-comment">
                            { comment }
                        </p>
                    </div>
                    { loggedInUser && isUsersData(loggedInUser._id, userId) && (
                        <div className="comment-post__interaction">
                            <button className="button button--red" onClick={ () => deleteComment(postId, _id) }>Delete Comment</button>  
                        </div>
                    ) }

                </div>
            ) }
        </Fragment>
    )
}

export default CommentPost;