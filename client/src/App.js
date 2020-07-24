import React, { Fragment } from 'react';
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.min.css';
import './App.css';
import Register from './components/auth/local/Register';
import Login from './components/auth/local/Login';
import ActivateAccount from './components/auth/local/ActivateAccount';
import ForgotPassword from './components/auth/local/ForgotPassword';
import ResetPassword from './components/auth/local/ResetPassword';
import Base from './components/layouts/Base';
import Navigation from './components/layouts/Navigation';
import Footer from './components/layouts/Footer';
import Loader from './components/layouts/Loader';
import PrivateRoute from './components/routing/PrivateRoute';
import Random from './components/layouts/Random';
import CreatePost from './components/post/CreatePost';
import EditPost from './components/post/EditPost';
import Post from './components/post/Post';
import AccountProfile from './components/account/AccountProfile';

import AuthState from "./context/authContext/AuthState";
import PostState from "./context/postContext/PostState";
import UserState from "./context/userContext/UserState";

function App (props) {
  return (
    <Router>
      <AuthState>
      <PostState>
      <UserState>
        <Fragment>
          <Loader />
          <ToastContainer autoClose={ 4000 } pauseOnHover={ false } />
          <Navigation />
          <main className="main">
            <Switch>
              <Route path='/' exact component={ Base } />
              <Route path='/register' exact component={ Register } />
              <Route path='/login' exact component={ Login } />
              <Route path='/forgot-password' exact component={ ForgotPassword } />
              <Route path='/auth/password/reset/:token' exact component={ ResetPassword } />
              <Route path='/auth/activate/:token' history={props.history} exact component={ ActivateAccount } />
              <Route path='/create-post' history={props.history} exact component={ CreatePost } />
              <Route path='/edit-post' history={props.history} exact component={ EditPost } />
              <Route path='/post/:id' history={props.history} exact component={ Post } />
              <Route path='/profile/:id' history={props.history} exact component={ AccountProfile } />
              <PrivateRoute path='/random' exact component={ Random } />
            </Switch>
          </main>
          <Footer />
        </Fragment>
      </UserState>
      </PostState>
      </AuthState>
    </Router>

  );
}

export default App;
