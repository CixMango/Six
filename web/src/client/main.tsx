import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/archivo/wdth.css';
import './styles/tokens.css';
import './styles/base.css';
import './styles/broadcast.css';
import './styles/screens.css';
import { applyBloom, applyTheme, bloomOn, currentTheme } from './lib/theme.ts';
import { App } from './App.tsx';

applyTheme(currentTheme());
applyBloom(bloomOn());

// The downloaded app stops a while after the last page closes; open pages check in so it keeps running.
setInterval(() => void fetch('/api/alive').catch(() => undefined), 60_000);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
