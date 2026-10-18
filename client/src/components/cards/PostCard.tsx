import { memo } from 'react';
import svg from '../../assets/images/icons/sprite.svg'
import { formatDate } from '../../lib/formatDate';
import { Link } from 'react-router';
import { useAuth } from '../../context/authContext/AuthContext';
import type { PostWithAuthor } from '../../lib/types';
import { uploadUrl, onImageError } from '../../utils/imageUrl';
import { descriptionTrimmer, postIsLiked } from '../../utils/postUtils';
import LikeButton from './LikeButton';

interface PostCardProps {
    post: PostWithAuthor;
    // 'account' is the two-column card on the account page.
    variant?: 'account';
}

const PostCard = ({ post: { _id, title, image, date, tag, description, user, likes, comments }, variant }: PostCardProps) => {

    const { loggedInUser } = useAuth();

    return (
        <div className={ variant === 'account' ? 'card card--account' : 'card' }>
            <Link to={`/post/${_id}`}>
                <div className="card__header">
                    <img className="card__image" src={ uploadUrl('posts', image) } onError={ onImageError('posts') } alt={ title } title={ title } />
                    <h5 className={ tag === 'travel' ? 'tag tag--orange card__tag': tag === 'funny' ? 'tag tag--yellow card__tag': 'tag card__tag'}>
                        { tag }
                    </h5>
                </div>
            </Link>
            <div className="card__details">
                <Link to={`/post/${_id}`} className="card__title">{ title }</Link>
                <p className="card__description">{ descriptionTrimmer(description) }</p>
                <div className="card-interaction">
                    <div className="card-interaction__item">
                        <svg className="card-interaction__icon card-interaction__icon--comment" aria-hidden="true" focusable="false">
                            <use xlinkHref={`${svg}#icon-comment-o`}></use>
                        </svg>
                        <span>{ comments.length } { comments.length === 1 ? 'Comment' : 'Comments' }</span>
                    </div>
                    <div className="card-interaction__item">
                        <LikeButton postId={ _id } title={ title } liked={ Boolean(postIsLiked(likes, loggedInUser)) } />
                        <span>{ likes.length } { likes.length === 1 ? 'Like' : 'Likes' }</span>	
                    </div>
                </div>
            </div>
            {/* String(): a post whose author is gone has user null and has always linked to /profile/undefined. Kept as is. */}
            <Link to={`/profile/${String(user?._id)}`} className="card__footer-link">
                <div className="card__footer">
                    <img className="avatar card__avatar" src={ uploadUrl('users', user?.avatar) } onError={ onImageError('users') } alt="" />
                    <div className="card__author">
                        <div className="card__author-name">{ user?.name }</div>
                        <div className="card__author-date">Posted on: { formatDate(date) }</div>
                    </div>
                </div>
            </Link>
        </div>
    )
}

// memo: a like patches one post, so the other cards keep their props and do not render again.
export default memo(PostCard);
