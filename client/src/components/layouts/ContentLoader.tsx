import { Fragment } from 'react';

const ContentLoader = () => {
    return (
        <Fragment>
            <div className="loader">
                <div className="loader__spinner">
                    <div className="loader__ring loader__ring--one"></div>
                    <div className="loader__ring loader__ring--two"></div>
                    <div className="loader__ring loader__ring--three"></div>
                </div>
            </div>
        </Fragment>
    )
}

export default ContentLoader;