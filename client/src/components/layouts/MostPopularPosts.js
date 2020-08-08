import React, { Fragment, useContext, useEffect } from 'react';
import PostCard from '../cards/PostCard';
import PostContext from '../../context/postContext/PostContext';
import ContentLoader from '../layouts/ContentLoader';

const MostPopularPosts = () => {
    const { getAllPosts, posts, postLoading } = useContext(PostContext);
    
    useEffect(() => {
        if (posts.length === 0) {
            getAllPosts();
        }
    }, [])

    return (
        <Fragment>
            { postLoading ? (<ContentLoader />) : (
                <section className="all-posts">
                    <div className="container">
                        <div className="cards">
                            { posts.length === 0 ? <h3>No Content Found...</h3> : posts
                                .sort((a, b) => b.likes.length - a.likes.length)
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
