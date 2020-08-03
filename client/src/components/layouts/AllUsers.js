import React, { useEffect, useContext, useState } from 'react';
import UserCard from '../cards/UserCard';
import UserContext from '../../context/userContext/UserContext';

const AllUsers = () => {
    const { getAllUsers, users } = useContext(UserContext);

    useEffect(() => {
        getAllUsers();
    }, []);
    
    return (
        <section className="all-user">
            <div className="container">
                <div className="all-userCards">
                    { users?.map(user => <UserCard key={ user._id } user={ user }/>) }
                </div>
            </div>
        </section>
    )
}

export default AllUsers;