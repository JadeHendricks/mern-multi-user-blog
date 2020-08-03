import { GET_ALL_USERS, GET_ALL_USERS_POSTS, GET_USER  } from '../types';
  
export default ( state, action ) => {
    switch (action.type) {
        case GET_ALL_USERS: 
            return {
                ...state,
                users: action.payload,
                userLoading: false,
            }
        case GET_USER: 
            return {
                ...state,
                user: action.payload,
                userLoading: false
            }
        case GET_ALL_USERS_POSTS: 
            return {
                ...state,
                userPosts: action.payload,
                userLoading: false
            }
        default: 
        return state;
    }
};