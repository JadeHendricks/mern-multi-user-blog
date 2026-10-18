import svg from '../../assets/images/icons/sprite.svg';
import { useAuth } from '../../context/authContext/AuthContext';
import type { PostWithAuthor } from '../../lib/types';
import { Link } from 'react-router';
import { uploadUrl, onImageError } from '../../utils/imageUrl';
import { descriptionTrimmer, postIsLiked } from '../../utils/postUtils';
import { useToggleLike } from '../../hooks/useToggleLike';
import { useDeletePost } from '../../hooks/useDeletePost';
interface ProfileCardProps {
    post: PostWithAuthor;
}

const ProfileCard = ({ post: { _id, title, image, tag, description, comments, likes } }: ProfileCardProps) => {
    const { loggedInUser } = useAuth();
    const toggleLike = useToggleLike();
    const deletePost = useDeletePost();
    // useDeletePost only leaves the page once the server confirmed the delete.
    const handleDelete = () => {
        if (!window.confirm('Delete this post? This cannot be undone.')) {
            return;
        }
        deletePost.mutate(_id);
    };
    return (
        <div className="card">
            <Link to={`/post/${_id}`}>
            <div className="card__header">
                <img className='card__image' src={ uploadUrl('posts', image) } onError={ onImageError('posts') } alt={ loggedInUser?.name } title={ loggedInUser?.name } />
                <h5 className={ tag === 'travel' ? 'card__tag card__tag--orange': tag === 'funny' ? 'card__tag card__tag--yellow': 'card__tag'}>
                    { tag }
                </h5>
            </div>
            </Link>
            <div className="card__details">
                <Link to={`/post/${_id}`} className="card__title">{ title }</Link>
                <p className="card__description">
                    { descriptionTrimmer(description) }
                </p>
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
            <div className="card__user">
                <div className="card__user-options">
                    <Link to={`/edit-post/${_id}`} className="button button--yellow">Edit post</Link>
                    <button type="button" onClick={ handleDelete } className="button button--red">Delete post</button>
                </div>
            </div>
        </div>
    )
}
export default ProfileCard;
