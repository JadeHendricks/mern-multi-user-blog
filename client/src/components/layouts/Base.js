import React, { useState, useEffect } from 'react';
import axios from 'axios';
import PostCard from '../cards/PostCard'

const Base = () => {

    const [posts, setPosts] = useState([]);

    const getAllPosts = async () => { 
        try {
            const res = await axios.get('/api/post');
            setPosts(res.data.posts);
        } catch (err) {
            console.log(err.response.message);
        }
    }

    useEffect(() => {
        getAllPosts();
    }, [])

    return (
        <section className="all-posts">
            <div className="container">
                <div className="cards">
                    { posts.map(post => <PostCard key={ post._id } post={ post } /> ) }
                </div>
            </div>
        </section>
    )
}

export default Base;
