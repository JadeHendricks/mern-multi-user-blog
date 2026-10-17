import React, { Fragment } from 'react';
import UserCard from '../cards/UserCard';
import ContentLoader from '../layouts/ContentLoader';
import { useUsers } from '../../hooks/useUsers';
const AllUsers = () => {
    // A failed request shows the toast and the empty state, as before.
    const { data: users = [], isPending } = useUsers();
    return (
        <Fragment>
            { isPending ? (<ContentLoader />) : (
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
