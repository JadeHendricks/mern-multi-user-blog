import { memo } from 'react';
import svg from '../../assets/images/icons/sprite.svg'
import { formatDate } from '../../lib/formatDate';
import { Link } from 'react-router';
import { useAuth } from '../../context/authContext/AuthContext';
import type { PostWithAuthor } from '../../lib/types';
import { uploadUrl, onImageError } from '../../utils/imageUrl';
import { descriptionTrimmer, postIsLiked } from '../../utils/postUtils';
import { useToggleLike } from '../../hooks/useToggleLike';

interface PostCardProps {
    post: PostWithAuthor;
}

const PostCard = ({ post: { _id, title, image, date, tag, description, user, likes, comments } }: PostCardProps) => {

    const { loggedInUser } = useAuth();	    
    const toggleLike = useToggleLike();

    return (
        <div className="card">
            <Link to={`/post/${_id}`}>
                <div className="card__header">
                    <img className="card__image" src={ uploadUrl('posts', image) } onError={ onImageError('posts') } alt={ user?.name } title={ user?.name } />
                    <h5 className={ tag === 'travel' ? 'tag tag--orange card__tag': tag === 'funny' ? 'tag tag--yellow card__tag': 'tag card__tag'}>
                        { tag }
                    </h5>
                </div>
            </Link>
            <div className="card__details">
                <Link to={`/post/${_id}`} className="card__title">{ title }</Link>
                <p className="card__description">{ descriptionTrimmer(description) }</p>
                <div className="card__interaction">
                    <div className="card__interaction-block">
                        <svg className="card__interaction-icon card__interaction-icon-comment">
                            <use xlinkHref={`${svg}#icon-comment-o`}></use>
                        </svg>
                        <span>{ comments.length } { comments.length === 1 ? 'Comment' : 'Comments' }</span>
                    </div>
                    <div className="card__interaction-block">	
                        { postIsLiked(likes, loggedInUser) ? 	
                            <svg className="card__interaction-icon" onClick={ () => { toggleLike(_id, true); } }>	
                                <use xlinkHref={`${svg}#icon-heart`}></use>	
                            </svg> :
                            <svg className="card__interaction-icon" onClick={ () => { toggleLike(_id, false); } }>	
                                <use xlinkHref={`${svg}#icon-heart-o`}></use>	
                            </svg>	
                        }
                        <span>{ likes.length } { likes.length === 1 ? 'Like' : 'Likes' }</span>	
                    </div>
                </div>
            </div>
            {/* String(): a post whose author is gone has user null and has always linked to /profile/undefined. Kept as is. */}
            <Link to={`/profile/${String(user?._id)}`} className="card__user-link">
                <div className="card__user">
                    <img className="avatar card__user-image" src={ uploadUrl('users', user?.avatar) } onError={ onImageError('users') } alt={ user?.name } title={ user?.name } />
                    <div className="card__user-info">
                        <div>{ user?.name }</div>
                        <div>Posted on: { formatDate(date) }</div>
                    </div>
                </div>
            </Link>
        </div>
    )
}

// memo: a like patches one post, so the other cards keep their props and do not render again.
export default memo(PostCard);
