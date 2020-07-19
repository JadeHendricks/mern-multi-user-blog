import React, { Fragment } from 'react';
import svg from '../../assets/images/icons/sprite.svg'

const FullPost = () => {
    return (
        <Fragment>
            <div className="post">
                <div className="post__banner">
                    <div className="author-options">
                        <button className="button button--yellow">Edit Post</button>
                        <button className="button button--red">Delete Post</button>
                    </div>
                    <div className="back-button">
                        <button className="button button--white">Go back</button>
                    </div>
                </div>
                <div className="post__container">
                    <div className="post__header">
                    <div className="post__top">
                        <div className="post__image-block">
                            <img src="./images/seven-img1.png" alt="Post Image" title="Post Image" />
                        </div>
                        <h1 className="post__title">How to build your professional network</h1>
                    </div>

                    <div className="post__user">
                        <div className="post__user-block">
                            <img className="post__user-icon" src="./images/jade-hendricks.jpg" alt="Photo of Jade Hendricks" title="Photo of Jade Hendricks" />
                            <span className="post__user-name">John Doe</span>
                        </div>
                        <div className="post__user-social">
                            <svg className="post__user-social-icon">
                                <use xlinkHref={`${svg}#icon-facebook-square`}></use>
                            </svg>  
                            <svg className="post__user-social-icon">
                                <use xlinkHref={`${svg}#icon-linkedin-square`}></use>
                            </svg>                                   
                            <svg className="post__user-social-icon">
                                <use xlinkHref={`${svg}#icon-twitter-square`}></use>
                            </svg>                                   
                        </div>
                    </div>
                </div>
                    <div className="post__body">
                    <h3>Lorem ipsum dolor sit.</h3>
                    <p>
                        Lorem ipsum dolor sit, amet consectetur adipisicing elit. Nisi esse minus reiciendis ipsa ab nemo maxime quos, 
                        quo error cumque, nam temporibus, adipisci molestiae sit soluta magni dignissimos quis dolorem facilis corporis 
                        eaque distinctio in enim! Accusamus, eaque excepturi. Repellendus.
                    </p>
                    <h3>Lorem ipsum dolor sit.</h3>
                    <p>
                        Lorem ipsum dolor sit, amet consectetur adipisicing elit. Enim sunt odit eos, quaerat, incidunt neque sint perspiciatis 
                        doloremque consectetur labore minus? Blanditiis neque quis, eaque possimus pariatur architecto reiciendis tenetur cupiditate
                        explicabo voluptatibus doloremque, optio temporibus odio perferendis non dicta. Vero delectus ea mollitia animi, vitae eligendi, 
                        possimus voluptate, quo enim harum temporibus corporis aperiam. Possimus, voluptates aliquid? Repudiandae modi eum tenetur laudantium 
                        magnam soluta, architecto unde voluptas! Unde autem repellat velit quas iure culpa! Exercitationem aliquid dolore corrupti, dignissimos 
                        numquam quasi, nam nisi qui et velit minima ipsum aliquam possimus facilis ipsa maiores. Iusto quisquam nisi hic mollitia at!
                    </p>
                    <p>
                        Lorem ipsum dolor sit amet consectetur adipisicing elit. Tempora tempore, et qui tenetur optio quasi nihil perferendis id beatae 
                        animi officia esse in accusamus corporis quae repudiandae nostrum velit debitis, deserunt voluptatum molestias, numquam aut. 
                        Reiciendis aut expedita illo voluptas. Dolores assumenda unde est! Velit deleniti sed ut in, repudiandae voluptates eum tempore 
                        quo ducimus animi eaque obcaecati aliquid neque eius facere quas veniam sapiente eos omnis mollitia dolore sequi dolores quisquam doloremque! 
                        Provident odit earum et in consequatur. Quasi qui eos, officiis ea dolores sunt quia accusantium quaerat, quas, natus adipisci soluta illo 
                        excepturi sed odio blanditiis omnis in cupiditate esse error nihil. Veritatis beatae accusantium sapiente sit molestias aut autem inventore, 
                        adipisci hic voluptatem sequi quasi reprehenderit repellat, deleniti incidunt odio. Repudiandae, aliquam reiciendis quod obcaecati earum repellat! 
                        Illum sint itaque tempora cumque voluptas eos eligendi adipisci vel pariatur nulla quasi aut quisquam rem, molestias, obcaecati asperiores in excepturi 
                        saepe laudantium? Tempora repudiandae veritatis debitis temporibus, odit nihil, non nisi quis, alias omnis autem nostrum quae optio vel? 
                        A expedita error ipsam ipsum voluptates esse aperiam enim, id ex numquam incidunt minus nihil facere iste aspernatur labore cum laboriosam architecto qui, 
                        aut cumque vero aliquid ducimus. Autem, molestias.
                    </p>
                </div>
            </div>
        </div>
    </Fragment>
    )
}

export default FullPost;