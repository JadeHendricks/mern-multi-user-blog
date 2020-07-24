import React, { useContext, useEffect, Fragment } from 'react';
import PostCard from '../cards/PostCard'
import PostContext from '../../context/postContext/PostContext';
import Loader from '../layouts/Loader';

const Base = () => {

    const { getAllPosts, posts, loading } = useContext(PostContext);

    useEffect(() => {
        getAllPosts();
    }, [])

    return (
        <Fragment>
            { loading || posts.length === 0 ? <Loader /> : (
                <section className="all-posts">
                    <div className="container">
                        <div className="cards">
                            { posts && posts.map(post => <PostCard key={ post._id } post={ post } /> ) }
                        </div>
                    </div>
                </section>
            ) }
        </Fragment>
    )
}

export default Base;
