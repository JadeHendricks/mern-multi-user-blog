import { LOGIN_SUCCESS, USER_LOADED, AUTH_ERROR, LOGOUT  } from '../types';
  
export default ( state, action ) => {
    switch (action.type) {
        case USER_LOADED: 
            return {
                ...state,
                isAuthenticated: true,
                authLoading: false,
                loggedInUser: action.payload
            }
        case LOGIN_SUCCESS:
            return {
                ...state,
                isAuthenticated: true,
                authLoading: false
            };
        case AUTH_ERROR:
        case LOGOUT:
            return {
                ...state,
                isAuthenticated: false,
                authLoading: true,
                loggedInUser: null
            };
        default: 
        return state;
    }
};