import React, { useEffect, useContext, Fragment } from 'react';
import UserCard from '../cards/UserCard';
import UserContext from '../../context/userContext/UserContext';

const AllUsers = () => {
    const { getAllUsers, users, userLoading} = useContext(UserContext);

    useEffect(() => {
        getAllUsers();
    }, []);
    
    return (
        <Fragment>
            { userLoading ? (<h1>LOADING</h1>) : (
                <section className="all-user">
                    <div className="container">
                        <div className="all-userCards">
                            { users?.map(user => <UserCard key={ user._id } user={ user }/>) }
                        </div>
                    </div>
                </section>
            ) }
        </Fragment>

    )
}

export default AllUsers;