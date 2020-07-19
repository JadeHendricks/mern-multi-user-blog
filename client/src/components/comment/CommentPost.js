import React from 'react';
import svg from '../../assets/images/icons/sprite.svg'

const CommentPost = () => {
    return (
        <div className="comment-post">
            <div className="comment-post__icon">
                <img src="./images/jade-hendricks.jpg" alt="Photo of Jade Hendricks" title="Photo of Jade Hendricks" />
            </div>
            <div className="comment-post__information">
                <h5 className="comment-post__user-name">John Doe <span>30 August 2020</span></h5>
                <p className="comment-post__user-comment">
                    Lorem ipsum dolor sit, amet consectetur adipisicing elit. 
                    A, nobis ipsum. Quidem voluptatem a pariatur corrupti sunt obcaecati nam suscipit deleniti tenetur ullam, est vitae.
                </p>
            </div>
            <div className="comment-post__interaction">
                <span className="comment-post__count">0</span>
                <svg className="comment-post__post-icon">
                    <use xlinkHref={`${svg}#icon-thumbs-o-up`}></use>
                </svg>    
                <span className="comment-post__count">0</span>
                <svg className="comment-post__post-icon">
                    <use xlinkHref={`${svg}#icon-thumbs-o-down`}></use>
                </svg>    
            </div>
        </div>
    )
}

export default CommentPost;