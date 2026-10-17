import { createRoot } from 'react-dom/client';
import App from './App';
// StrictMode is off until the react-router 7 commit. React 18 StrictMode mounts, unmounts and
// remounts every component once in dev. react-router 5 subscribes to history in the Router
// constructor and unsubscribes on unmount, so after that remount the router never hears about
// navigation again: the URL changes but nothing re-renders (e2e: Redirect to /login, forgot-password
// link). Router 7 does not have this problem, and StrictMode comes back with it.
createRoot(document.getElementById('root')).render(<App />);
