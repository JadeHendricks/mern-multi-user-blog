import React, { Fragment } from 'react';
import PostCard from '../cards/PostCard'
import ContentLoader from '../layouts/ContentLoader';
import LoadMore from './LoadMore';
import { usePostsInfinite } from '../../hooks/usePostsInfinite';
const Base = () => {
    // A failed request shows the toast and the empty state, as before.
    const { data: posts = [], isPending, hasNextPage, isFetchingNextPage, fetchNextPage } = usePostsInfinite();
    return (
        <Fragment>
            { isPending ? (<ContentLoader />): (
                <section className="all-posts">
                    <div className="container">
                        <div className="cards">
                            { posts.length === 0 ? <h3 style={{ textAlign: 'center' }}>No Content Found...</h3> : posts?.map(post => <PostCard key={ post._id } post={ post } /> )}
                        </div>
                        { hasNextPage && <LoadMore onClick={ () => fetchNextPage() } loading={ isFetchingNextPage } /> }
                    </div>
                </section>
            ) } 
        </Fragment>
    )
}
export default Base;
