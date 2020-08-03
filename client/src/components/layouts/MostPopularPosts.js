import React, { useState, useContext, useEffect } from 'react';
import PostCard from '../cards/PostCard';
import PostContext from '../../context/postContext/PostContext';

const MostPopularPosts = () => {
    const { getAllPosts, posts } = useContext(PostContext);
    
    useEffect(() => {
        getAllPosts();
    }, [])

    return (
        <section className="all-posts">
            <div className="container">
                <div className="cards">
                    { posts?.sort((a, b) => b.likes.length - a.likes.length).slice(0, 6).map(post => <PostCard key={ post._id } post={ post } /> ) }
                </div>
            </div>
        </section>
    )
}

export default MostPopularPosts;
