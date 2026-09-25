// Public build: the bot runs in the browser with no server (see scripts/build-play.mjs).
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Redirect, Route, Switch } from 'wouter';
import '@fontsource-variable/archivo/wdth.css';
import '../client/styles/tokens.css';
import '../client/styles/base.css';
import '../client/styles/broadcast.css';
import '../client/styles/screens.css';
import { applyBloom, applyTheme, bloomOn, currentTheme } from '../client/lib/theme.ts';
import { BotMatchScreen } from '../client/screens/BotMatchScreen.tsx';
import { WatchScreen } from '../client/screens/WatchScreen.tsx';
import { SiteReviewScreen } from '../client/screens/ReviewScreen.tsx';
import { PlayHome } from './PlayHome.tsx';

function PlayApp() {
  return (
    <Switch>
      <Route path="/" component={PlayHome} />
      <Route path="/bot">{() => <BotMatchScreen offline />}</Route>
      <Route path="/watch">{() => <WatchScreen offline />}</Route>
      <Route path="/review" component={SiteReviewScreen} />
      <Route>
        <Redirect to="/" />
      </Route>
    </Switch>
  );
}

applyTheme(currentTheme());
applyBloom(bloomOn());

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PlayApp />
  </StrictMode>,
);
