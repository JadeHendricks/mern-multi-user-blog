import React from 'react';
import ProfileCard from '../cards/ProfileCard';

const AccountPosts = () => {
    return (
        <section class="account-posts">
            <div class="cards cards--account">
                <ProfileCard />
                <ProfileCard />
                <ProfileCard />
            </div>
        </section>
    )
}

export default AccountPosts;
