import React, { useEffect } from 'react';
import svg from '../../assets/images/icons/sprite.svg'
import placeholderUserImage from '../../assets/images/jade-hendricks.jpg';

const CommentPost = ({ comment: { user, comment } }) => {

    return (
        <div className="comment-post">
            <div className="comment-post__icon">
                <img src={ placeholderUserImage } alt="Photo of Jade Hendricks" title="Photo of Jade Hendricks" />
            </div>
            <div className="comment-post__information">
                <h5 className="comment-post__user-name">John Doe <span>30 August 2020</span></h5>
                <p className="comment-post__user-comment">
                    { comment }
                </p>
            </div>
            <div className="comment-post__interaction">
                <button className="button button--red">Delete Comment</button>  
            </div>
        </div>
    )
}

export default CommentPost;