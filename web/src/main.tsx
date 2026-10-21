import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import { applyTheme, readTheme } from './lib/theme';
import { registerServiceWorker } from './pwa/register';

applyTheme(readTheme());
const root = document.getElementById('root');
if (root === null) {
  throw new Error('#root 요소가 없다');
}
createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

void registerServiceWorker();
