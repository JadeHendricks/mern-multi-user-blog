import { GET_USER, GET_ALL_USERS, CLEAR_USER, USER_ERROR  } from '../types';
  
export default ( state, action ) => {
    switch (action.type) {
        case GET_ALL_USERS: 
            return {
                ...state,
                users: action.payload,
                loading: false,
            }
        case GET_USER:
            console.log(action.payload); 
            return {
                ...state,
                user: action.payload,
                loading: false,
            }
        case USER_ERROR: 
        case CLEAR_USER: 
            return {
                ...state,
                user: {},
                users: [],
                loading: true
            }
        default: 
        return state;
    }
};