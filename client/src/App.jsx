import React, { Suspense, lazy } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router';
import './App.css';
import Register from './components/auth/local/Register';
import Login from './components/auth/local/Login';
import ActivateAccount from './components/auth/local/ActivateAccount';
import ForgotPassword from './components/auth/local/ForgotPassword';
import ResetPassword from './components/auth/local/ResetPassword';
import Base from './components/layouts/Base';
import AppShell from './components/layouts/AppShell';
import RequireAuth from './components/routing/RequireAuth';
import CreatePost from './components/post/CreatePost';
import EditPost from './components/post/EditPost';
import Post from './components/post/Post';
import AccountProfile from './components/account/AccountProfile';
import AllUsers from './components/layouts/AllUsers';
import MostPopularPosts from './components/layouts/MostPopularPosts';
import { queryClient } from './lib/queryClient';
import AuthState from "./context/authContext/AuthState";
import PostState from "./context/postContext/PostState";
import UserState from "./context/userContext/UserState";

// Dev only: import.meta.env.DEV is false in a production build, so the devtools chunk is never
// bundled. VITE_QUERY_DEVTOOLS=false hides it in dev too (Playwright does, so the floating button
// is not in screenshots).
const ReactQueryDevtools =
  import.meta.env.DEV && import.meta.env.VITE_QUERY_DEVTOOLS !== 'false'
    ? lazy(() => import('@tanstack/react-query-devtools').then(m => ({ default: m.ReactQueryDevtools })))
    : null;
function App () {
  return (
    <QueryClientProvider client={ queryClient }>
    <BrowserRouter>
      <AuthState>
      <PostState>
      <UserState>
        <Routes>
          <Route element={ <AppShell /> }>
            <Route path='/' element={ <Base /> } />
            <Route path='/register' element={ <Register /> } />
            <Route path='/login' element={ <Login /> } />
            <Route path='/forgot-password' element={ <ForgotPassword /> } />
            <Route path='/auth/password/reset/:token' element={ <ResetPassword /> } />
            <Route path='/auth/activate/:token' element={ <ActivateAccount /> } />
            <Route element={ <RequireAuth /> }>
              <Route path='/create-post' element={ <CreatePost /> } />
              <Route path='/edit-post/:id' element={ <EditPost /> } />
            </Route>
            <Route path='/post/:id' element={ <Post /> } />
            <Route path='/profile/:id' element={ <AccountProfile /> } />
            <Route path='/users' element={ <AllUsers /> } />
            <Route path='/most-popular-posts' element={ <MostPopularPosts /> } />
            {/* Unknown URLs keep the shell with an empty main, as the old Switch without a catch-all did. */}
            <Route path='*' element={ null } />
          </Route>
        </Routes>
      </UserState>
      </PostState>
      </AuthState>
    </BrowserRouter>
    { ReactQueryDevtools && (
      <Suspense fallback={ null }>
        <ReactQueryDevtools initialIsOpen={ false } />
      </Suspense>
    ) }
    </QueryClientProvider>
  );
}

export default App;
