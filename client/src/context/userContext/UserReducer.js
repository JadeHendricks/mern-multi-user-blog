import { GET_ALL_USERS, GET_ALL_USERS_POSTS, GET_USER, UPDATE_USER, USER_ERROR } from '../types';
  
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
        case UPDATE_USER: 
            return {
                ...state,
                user: action.payload,
                userLoading: false
            }
        case USER_ERROR: 
            return {
                ...state,
                user: {},
                users: [],
                userLoading: false
            }
        default: 
        return state;
    }
};