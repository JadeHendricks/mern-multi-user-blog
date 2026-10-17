import { Fragment } from 'react';
import UserCard from '../cards/UserCard';
import ContentLoader from '../layouts/ContentLoader';
import LoadMore from './LoadMore';
import { useUsers } from '../../hooks/useUsers';
const AllUsers = () => {
    // A failed request shows the toast and the empty state, as before.
    const { data: users = [], isPending, hasNextPage, isFetchingNextPage, fetchNextPage } = useUsers();
    return (
        <Fragment>
            { isPending ? (<ContentLoader />) : (
                <section>
                    <div className="container">
                        <div className="all-users__cards">
                            { users.length === 0 ? <h3>No Content Found...</h3> : users.map(user => <UserCard key={ user._id } user={ user }/>) }
                        </div>
                        { hasNextPage && <LoadMore onClick={ () => void fetchNextPage() } loading={ isFetchingNextPage } /> }
                    </div>
                </section>
            ) }
        </Fragment>
    )
}
export default AllUsers;
