import { GET_ALL_POSTS, CREATE_COMMENT  } from '../types';
  
export default ( state, action ) => {
    switch (action.type) {
        case GET_ALL_POSTS: 
            return {
                ...state,
                posts: action.payload,
                loading: false,
            }
        case CREATE_COMMENT: 
            return {
                ...state,
                post: { ...state.post, comments: action.payload },
                loading: false,
            }
        default: 
        return state;
    }
};