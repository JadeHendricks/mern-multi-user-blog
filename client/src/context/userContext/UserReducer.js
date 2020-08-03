import { GET_ALL_USERS, GET_ALL_USERS_POSTS, GET_USER  } from '../types';
  
export default ( state, action ) => {
    switch (action.type) {
        case GET_ALL_USERS: 
            return {
                ...state,
                users: action.payload,
                loading: false,
            }
        case GET_USER: 
            return {
                ...state,
                user: action.payload,
                loading: false
            }
        case GET_ALL_USERS_POSTS: 
            return {
                ...state,
                userPosts: action.payload,
                loading: false
            }
        default: 
        return state;
    }
};