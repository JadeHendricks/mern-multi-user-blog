import React, { Fragment } from 'react';
import PostCard from '../cards/PostCard';
import ContentLoader from '../layouts/ContentLoader';
import { usePosts } from '../../hooks/usePosts';
const MostPopularPosts = () => {
    // Popular needs every post to rank them, so this is the unpaginated list the feed shares.
    const { data: posts = [], isPending } = usePosts();
    return (
        <Fragment>
            { isPending ? (<ContentLoader />) : (
                <section className="all-posts">
                    <div className="container">
                        <div className="cards">
                            { posts.length === 0 ? <h3>No Content Found...</h3> : posts
                                // toSorted works on a copy, so the cached list keeps its order.
                                .toSorted((a, b) => b.likes.length - a.likes.length)
                                .slice(0, 6)
                                .map(post => <PostCard key={ post._id } post={ post } /> ) }
                        </div>
                        </div>
                </section>
            ) }
        </Fragment>
    )
}
export default MostPopularPosts;
