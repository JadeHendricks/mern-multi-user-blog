import React from 'react';
import { Outlet } from 'react-router';
import { ToastContainer } from 'react-toastify';
import Navigation from './Navigation';
import Footer from './Footer';
import Loader from './Loader';

// Layout route: the page frame that every URL shares, with the page itself rendered in <main>.
const AppShell = () => (
  <>
    <Loader />
    <ToastContainer autoClose={ 4000 } pauseOnHover={ false } />
    <Navigation />
    <main className="main">
      <Outlet />
    </main>
    <Footer />
  </>
);

export default AppShell;
