import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
// Self-hosted Lato: exactly the faces the old Google Fonts link asked for (300, 300 italic, 700).
// Do not add 400: regular text falls back to the 300 face today and would get heavier.
import '@fontsource/lato/300.css';
import '@fontsource/lato/300-italic.css';
import '@fontsource/lato/700.css';
import App from './App';

const root = document.getElementById('root');
// A missing #root already crashed (createRoot(null)); this only says why.
if (!root) throw new Error('index.html has no #root element');

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>
);
