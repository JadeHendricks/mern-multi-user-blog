import { GET_USER, GET_ALL_USERS, USER_ERROR  } from '../types';
  
export default ( state, action ) => {
    switch (action.type) {
        case GET_ALL_USERS: 
            return {
                ...state,
                allUsers: action.payload,
                loading: false,
            }
        case GET_USER: 
            return {
                ...state,
                notAuthUser: action.payload,
                loading: false,
            }
        case USER_ERROR: 
            return {
                ...state,
                notAuthUser: null,
                allUsers: null,
                loading: true,
            }
        default: 
        return state;
    }
};