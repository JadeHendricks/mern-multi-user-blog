import { GET_POST, GET_ALLPOSTS, CREATE_POST, EDIT_POST, POST_ERROR  } from '../types';
  
export default ( state, action ) => {
    switch (action.type) {
        case GET_ALLPOSTS: 
            return {

            }
        case GET_POST: 
            return {

            }
        case CREATE_POST: 
            return {

            }
        case EDIT_POST: 
            return {

            }  
        case POST_ERROR: 
            return {

            }   
        default: 
        return state;
    }
};