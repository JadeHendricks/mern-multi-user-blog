import React, { useState, useEffect } from 'react';
import axios from 'axios';
import PostCard from '../cards/PostCard';
import { toast } from 'react-toastify';

const MostPopularPosts = () => {
    
    const [posts, setPosts] = useState([]);

    const getAllPosts = async () => { 
        try {
            const res = await axios.get('/api/post');
            const mostPopularPosts = res.data.posts.sort((a, b) => b.likes.length - a.likes.length).slice(0, 6);
            setPosts(mostPopularPosts);
        } catch (err) {
            console.error(err.response.data.message);
            toast.error(err.response.data.message);
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

export default MostPopularPosts;
