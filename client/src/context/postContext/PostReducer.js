import { GET_ALL_POSTS  } from '../types';
  
export default ( state, action ) => {
    switch (action.type) {
        case GET_ALL_POSTS: 
            return {
                ...state,
                posts: action.payload,
                loading: false,
            }
        default: 
        return state;
    }
};