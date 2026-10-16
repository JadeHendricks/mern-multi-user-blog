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
                // Bootstrap is finished once auth fails, so guards can redirect instead of spinning forever.
                authLoading: false,
                loggedInUser: null
            };
        default: 
        return state;
    }
};