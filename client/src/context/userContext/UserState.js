import React, { useReducer } from "react";
import UserContext from './UserContext';
import UserReducer from './UserReducer';
import { toast } from 'react-toastify';
import { withRouter } from 'react-router-dom';
import axios from 'axios';
import { GET_USER, GET_ALL_USERS, USER_ERROR  } from '../types';

const UserState = props => {

    const initialState = {
        user: null,
        users: null,
        loading: true,
        error: null
    };

    const getUser = async (id) => {
        try {
            const res = await axios.get(`/api/user/${id}`);
            dispatch({ 
                type: GET_USER, 
                payload: res.data.user
            });
        } catch (err) {
            dispatch({
                type: USER_ERROR,
                payload: err.response.message
            });
        }
    }

    const getAllUsers = async () => {
        try {
            const res = await axios.get('/api/user');
            dispatch({ 
                type: GET_ALL_USERS, 
                payload: res.data.users
            });
        } catch (err) {
            dispatch({
                type: USER_ERROR,
                payload: err.response.message
            });
        }
    }
    
    const [state, dispatch] = useReducer(UserReducer, initialState);

    return (
        <UserContext.Provider value={{
            user: state.notAuthUser,
            users: state.allUsers,
            loading: state.loading,
            error: state.error,
            getUser,
            getAllUsers

        }}>
          { props.children }
        </UserContext.Provider>
      )
}

export default withRouter(UserState);