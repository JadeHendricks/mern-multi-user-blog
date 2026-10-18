import svg from '../../assets/images/icons/sprite.svg';
import { useToggleLike } from '../../hooks/useToggleLike';

interface LikeButtonProps {
    postId: string;
    title: string;
    liked: boolean;
}

// The heart on a post card. A real button, so the keyboard can reach and press it, and aria-pressed
// says whether the signed-in user likes the post. The label stays the same in both states (the state
// is announced through aria-pressed) and carries the title so several hearts on one page differ.
const LikeButton = ({ postId, title, liked }: LikeButtonProps) => {
    const toggleLike = useToggleLike();

    return (
        <button
            type="button"
            className="card-interaction__like"
            aria-pressed={ liked }
            aria-label={ `Like ${title}` }
            onClick={ () => { toggleLike(postId, liked); } }
        >
            <svg className="card-interaction__icon" aria-hidden="true" focusable="false">
                <use xlinkHref={`${svg}#${liked ? 'icon-heart' : 'icon-heart-o'}`}></use>
            </svg>
        </button>
    );
};

export default LikeButton;
