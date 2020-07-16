import React, { useContext } from 'react';
import AuthContext from '../../context/authContext/AuthContext';

const Dashboard = () => {
    const { user } = useContext(AuthContext);

    return (
        <section className="py-5">
            <div className="col-md-10 offset-md-1 col-sm-12">
                <h4 className="display-4 text-center">Hello { user && user.name }, Welcome to your DashBoard!</h4>
                <hr />
                <p className="lead">
                    Lorem ipsum dolor sit amet consectetur adipisicing elit. Iusto aperiam similique fuga rem deleniti eos possimus illum explicabo laudantium 
                    commodi iure assumenda reiciendis officiis veniam reprehenderit dolor quis at voluptate quisquam esse corrupti, corporis quas? 
                    Eligendi nemo ipsam autem libero!
                </p>
            </div>
        </section>
    )
}

export default Dashboard;
