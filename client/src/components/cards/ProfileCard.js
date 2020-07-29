import React, { useContext } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import svg from '../../assets/images/icons/sprite.svg'
import placeholderPostImage from '../../assets/images/seven-img1.png';
import AuthContext from '../../context/authContext/AuthContext';
import { Link } from 'react-router-dom';

const ProfileCard = ({ post: { _id, title, image, tag, description, comments, likes } }) => {

    const { loggedInUser } = useContext(AuthContext);

    const deletePost = async (e, id) => { 
        e.preventDefault()
        try {
            await axios.delete(`/api/post/${id}`); 
            toast.success('Post has been deleted');
        } catch (err) {
            console.log(err.response.message);
        }
    }

    const postIsLiked = () => {
        if (likes && loggedInUser) {
            const isLiked = likes.filter(like => like.user === loggedInUser._id);
            if (isLiked.length > 0) {
                return true;
            }
            return false;
        }
    }

    const likePost = async (id) => {
        try {
            await axios.put(`/api/post/like/${id}`);  
        } catch (err) {
            console.log(err.response.message);   
        }
    }

    const unLikePost = async (id) => {
        try {
            await axios.put(`/api/post/unlike/${id}`);  
        } catch (err) {
            console.log(err.response.message);  
        } 
    }

    const descriptionTrimmer = (desc) => {
        return desc.slice(0, 150) + '...';
    }

    return (
        <div className="card">
            <Link to={`/post/${_id}`}>
            <div className="card__header">
                { image && (
                    <img className="card__image" src={require(`../../assets/images/posts/${image}`)} alt={ title } title={ title } />
                ) }
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
                        { !postIsLiked() ? (
                            <svg className="card__interaction-icon" onClick={ () => likePost(_id) }>
                                <use xlinkHref={`${svg}#icon-heart-o`}></use>
                            </svg>
                        ) : (
                            <svg className="card__interaction-icon" onClick={ () => unLikePost(_id) }>
                                <use xlinkHref={`${svg}#icon-heart`}></use>
                            </svg>
                        ) }  
                        <span>{ likes.length } { likes.length === 1 ? 'Like' : 'Likes' }</span>
                    </div>
                </div>
            </div>
            <div className="card__user">
                <div className="card__user-options">
                    <Link to={`/edit-post/${_id}`} className="button button--yellow">Edit post</Link>
                    <Link to='/' onClick={ () => deletePost(_id) } className="button button--red">Delete post</Link>
                </div>
            </div>
        </div>
    )
}

export default ProfileCard;