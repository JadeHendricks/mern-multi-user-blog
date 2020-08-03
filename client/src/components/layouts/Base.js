import React, { useContext, useEffect, Fragment } from 'react';
import PostCard from '../cards/PostCard'
import PostContext from '../../context/postContext/PostContext';

const Base = () => {
    const { getAllPosts, posts, loading } = useContext(PostContext)

    useEffect(() => {
        getAllPosts();
    }, [])

    return (
        <Fragment>
            { loading ? 'LOADING!': (
                <section className="all-posts">
                    <div className="container">
                        <div className="cards">
                            { posts?.map(post => <PostCard key={ post._id } post={ post } /> ) }
                        </div>
                    </div>
                </section>
            ) } 
        </Fragment>
    )
}

export default Base;
