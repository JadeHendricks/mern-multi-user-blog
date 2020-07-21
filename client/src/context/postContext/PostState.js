import React, { useReducer, useEffect } from "react";
import PostContext from './PostContext';
import PostReducer from './PostReducer';
import { withRouter } from 'react-router-dom';
import axios from 'axios';
import { GET_POST, GET_ALLPOSTS, CREATE_POST, EDIT_POST, POST_ERROR  } from '../types';

const PostState = props => {
    const initialState = {

    };

    useEffect(() => {

    }, []);

    const [state, dispatch] = useReducer(PostReducer, initialState);

    return (
        <PostContext.Provider value={{

        }}>
          { props.children }
        </PostContext.Provider>
      )
}

export default withRouter(PostState);