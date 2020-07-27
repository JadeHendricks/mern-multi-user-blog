import React, { useEffect, useState } from 'react';
import axios from 'axios';
import UserCard from '../cards/UserCard';

const AllUsers = () => {
    const [users, setUsers] = useState([]);

    const getAllUsers = async () => {
        try {
            const res = await axios.get('api/user');
            setUsers(res.data.users);
        } catch (err) {
            console.log(err.response.message);
        }
    }

    useEffect(() => {
        getAllUsers();
    }, []);
    

    return (
        <section className="all-user">
            <div className="container">
                <div className="all-userCards">
                    { users.map(user => <UserCard key={ user._id } user={ user }/>) }
                </div>
            </div>
        </section>
    )
}

export default AllUsers;