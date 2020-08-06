import React, { useContext, useEffect, Fragment } from 'react';
import PostCard from '../cards/PostCard'
import PostContext from '../../context/postContext/PostContext';
import ContentLoader from '../layouts/ContentLoader';

const Base = () => {
    const { getAllPosts, posts, postLoading } = useContext(PostContext);

    useEffect(() => {
        getAllPosts();
    }, [])

    return (
        <Fragment>
            { postLoading ? (<ContentLoader />): (
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
