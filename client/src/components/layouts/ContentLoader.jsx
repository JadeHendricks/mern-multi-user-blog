import React, { Fragment } from 'react';

const ContentLoader = () => {
    return (
        <Fragment>
            <div className="loader-container">
                <div className="loader">
                    <div className="inner one"></div>
                    <div className="inner two"></div>
                    <div className="inner three"></div>
                </div>
            </div>
        </Fragment>
    )
}

export default ContentLoader;