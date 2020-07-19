import React from 'react';
import PostCard from '../cards/PostCard'

const Base = () => {
    return (
        <section className="all-posts">
        <div className="container">
            <div className="cards">
                <PostCard />
                <PostCard />
                <PostCard />
            </div>
        </div>
    </section>
    )
}

export default Base;
