import { GET_POST, GET_ALL_POSTS, CREATE_POST, EDIT_POST, DELETE_POST, CLEAR_POST, GET_USERS_POSTS, POST_ERROR  } from '../types';
  
export default ( state, action ) => {
    switch (action.type) {
        case GET_ALL_POSTS: 
            return {
                ...state,
                posts: action.payload,
                loading: false
            }
        case GET_POST: 
            return {
                ...state,
                post: action.payload,
                loading: false
            }
        case GET_USERS_POSTS: {
            return {
                ...state,
                userPosts: action.payload,
                loading: false
            }
        }
        case CREATE_POST: 
            return {
                ...state,
                posts: [action.payload, ...state.posts],
                loading: false
            }
        case DELETE_POST: 
            return {
                ...state,
                posts: state.posts.filter(post => post._id !== action.payload),
                loading: false
            }
        case EDIT_POST: 
            return {
                ...state,
                post: action.payload,
                loading: false
            }  
        case CLEAR_POST:
        case POST_ERROR: 
            return {
                ...state,
                posts: [],
                post: null,
                userPosts: [],
                loading: true,
                error: null
            }   
        default: 
        return state;
    }
};