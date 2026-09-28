import { Redirect, Route, Switch } from "wouter";
import { UpdatePrompt } from "./components/UpdatePrompt.tsx";
import { AnalysisScreen } from "./screens/AnalysisScreen.tsx";
import { AppReviewScreen } from "./screens/ReviewScreen.tsx";
import { BotMatchScreen } from "./screens/BotMatchScreen.tsx";
import { HomeScreen } from "./screens/HomeScreen.tsx";
import { ReplaysScreen } from "./screens/ReplaysScreen.tsx";
import { RoomScreen } from "./screens/RoomScreen.tsx";
import { TrainingScreen } from "./lib/localScreens.ts";
import { WatchScreen } from "./screens/WatchScreen.tsx";

export function App() {
  return (
    <>
      <UpdatePrompt />
      <Switch>
        <Route path="/" component={HomeScreen} />
        <Route path="/bot">{() => <BotMatchScreen />}</Route>
        <Route path="/room/:code" component={RoomScreen} />
        <Route path="/watch">{() => <WatchScreen />}</Route>
        <Route path="/analysis" component={AnalysisScreen} />
        <Route path="/analysis/:id" component={AnalysisScreen} />
        <Route path="/review/:id" component={AppReviewScreen} />
        <Route path="/replays" component={ReplaysScreen} />
        {TrainingScreen && (
          <Route path="/training" component={TrainingScreen} />
        )}
        <Route>
          <Redirect to="/" />
        </Route>
      </Switch>
    </>
  );
}
