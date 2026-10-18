import type { CSSProperties } from 'react';
import { Outlet } from 'react-router';
import { ToastContainer } from 'react-toastify';
import Navigation from './Navigation';
import Footer from './Footer';
import Loader from './Loader';

// Layout route: the page frame that every URL shares, with the page itself rendered in <main>.
const AppShell = () => (
  <>
    <Loader />
    {/* theme, icon, width and padding keep the toast looking like react-toastify 6 did: red, no
        icon, same size and text position. Only the close cross is drawn differently by 11. */}
    <ToastContainer
      autoClose={ 4000 }
      pauseOnHover={ false }
      theme="colored"
      icon={ false }
      // CSSProperties has no index signature for custom properties, so the cast is the usual way to set them.
      style={{ '--toastify-toast-width': '312px', '--toastify-toast-padding': '10px' } as CSSProperties}
    />
    <Navigation />
    <main className="main">
      <Outlet />
    </main>
    <Footer />
  </>
);

export default AppShell;
