import { GET_ALL_POSTS, GET_POST, CREATE_COMMENT, DELETE_COMMENT, UPDATE_LIKES, POST_ERROR  } from '../types';
  
export default ( state, action ) => {
    switch (action.type) {
        case GET_ALL_POSTS: 
            return {
                ...state,
                posts: action.payload,
                postLoading: false,
            }
        case GET_POST: 
            return {
                ...state,
                post: action.payload,
                postLoading: false,
            }
        case CREATE_COMMENT: 
            return {
                ...state,
                post: { ...state.post, comments: action.payload },
                postLoading: false,
            }
        case DELETE_COMMENT: 
            return {
                ...state,
                post: { ...state.post, comments: state.post.comments.filter(comment => comment._id !== action.payload)},
                loading: false
            }
        case UPDATE_LIKES: 
            return {
                ...state,
                post: state.post._id === action.payload.postId ? { ...state.post, likes: action.payload.likes } : state.post,
                posts: state.posts.map(post => post._id === action.payload.postId ? { ...post, likes: action.payload.likes } : post ),
                loading: false
            }
        case POST_ERROR: 
            return {
                ...state,
                post: {},
                posts: [],
                postLoading: false,
            }
        default: 
        return state;
    }
};