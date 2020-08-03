import { GET_ALL_POSTS, GET_POST, CREATE_COMMENT  } from '../types';
  
export default ( state, action ) => {
    switch (action.type) {
        case GET_ALL_POSTS: 
            return {
                ...state,
                posts: action.payload,
                postLoading: false,
            }
        case GET_POST: 
            return {
                ...state,
                post: action.payload,
                postLoading: false,
            }
        case CREATE_COMMENT: 
            return {
                ...state,
                post: { ...state.post, comments: action.payload },
                postLoading: false,
            }
        default: 
        return state;
    }
};