import React, { useContext, useEffect } from 'react';
import PostCard from '../cards/PostCard'
import PostContext from '../../context/postContext/PostContext';

const Base = () => {

    const { getAllPosts, posts } = useContext(PostContext)

    useEffect(() => {
        getAllPosts();
    }, [])

    return (
        <section className="all-posts">
        <div className="container">
            <div className="cards">
                { posts && posts.map(post => <PostCard key={ post._id } post={ post } /> ) }
            </div>
        </div>
    </section>
    )
}

export default Base;
