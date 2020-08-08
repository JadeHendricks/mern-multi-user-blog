import React, { useEffect, useContext, Fragment } from 'react';
import UserCard from '../cards/UserCard';
import UserContext from '../../context/userContext/UserContext';
import ContentLoader from '../layouts/ContentLoader';

const AllUsers = () => {
    const { getAllUsers, users, userLoading} = useContext(UserContext);

    useEffect(() => {
        getAllUsers();
    }, []);
    
    return (
        <Fragment>
            { userLoading ? (<ContentLoader />) : (
                <section className="all-user">
                    <div className="container">
                        <div className="all-userCards">
                            { users.length === 0 ? <h3>No Content Found...</h3> : users.map(user => <UserCard key={ user._id } user={ user }/>) }
                        </div>
                    </div>
                </section>
            ) }
        </Fragment>

    )
}

export default AllUsers;