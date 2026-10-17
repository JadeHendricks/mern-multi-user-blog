import React from 'react';

// Shown by the feed and the users page only while the server has another page (nextCursor).
const LoadMore = ({ onClick, loading }) => (
    <div className="load-more">
        <button type="button" className="button button--green load-more__button" onClick={ onClick } disabled={ loading }>Load more</button>
    </div>
);

export default LoadMore;
