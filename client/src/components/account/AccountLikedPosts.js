import React from 'react';
import PostCard from '../cards/PostCard';

const AccountLikedPosts = () => {
    return (
        <section class="account-liked-posts">
            <div class="cards cards--account">
                <PostCard />
                <PostCard />
                <PostCard />
            </div>
        </section>
    )
}

export default AccountLikedPosts;
