import React, { Fragment, useContext, useEffect } from 'react';
import PostCard from '../cards/PostCard';
import PostContext from '../../context/postContext/PostContext';

const MostPopularPosts = () => {
    const { getAllPosts, posts, postLoading } = useContext(PostContext);
    
    useEffect(() => {
        if (posts.length === 0) {
            getAllPosts();
        }
    }, [])

    return (
        <Fragment>
            { postLoading ? (<h1>LOADING</h1>) : (
                <section className="all-posts">
                    <div className="container">
                        <div className="cards">
                            { posts?.sort((a, b) => b.likes.length - a.likes.length).slice(0, 6).map(post => <PostCard key={ post._id } post={ post } /> ) }
                        </div>
                    </div>
                </section>
            ) }
        </Fragment>
    )
}

export default MostPopularPosts;
