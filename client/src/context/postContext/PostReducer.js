import { GET_POST, GET_ALL_POSTS, CREATE_POST, EDIT_POST, DELETE_POST, POST_ERROR  } from '../types';
  
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

            }  
        case POST_ERROR: 
            return {
                ...state,
                error: action.payload
            }   
        default: 
        return state;
    }
};