import { v4 as uuid } from "uuid";
import { store } from "./index";
import actions from "./actions";
import { listen } from "../utils/socket";

let lastDispatchedStoryVersion: number | null = null;

listen("STORY_CHANGED", uuid(), (message) => {
  if (message.type !== "STORY_CHANGED") return;

  if (
    lastDispatchedStoryVersion !== null &&
    message.payload.version <= lastDispatchedStoryVersion
  ) {
    return;
  }

  lastDispatchedStoryVersion = message.payload.version;

  store.dispatch(actions.storiesById.setStory(message.payload));
});
