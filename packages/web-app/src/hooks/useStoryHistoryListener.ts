import React from "react";
import * as firebase from "firebase/app";
import { useDispatch } from "react-redux";
import actions from "../store/actions";
import { useEntriesRef } from "./useStoryRef";
import {
  isObjectOf,
  isString,
  isArrayOfStrings,
  isDateString,
  isKeyedObjectOf,
  isNumber,
} from "../utils/typeGuards";
import { DatabaseSession } from "../sharedTypes";
import sortSessions from "../utils/sortSessions";
import { Session } from "../store/sessionsById/types";
import { StoryFetchStatus } from "../store/storyFetchStateByStoryId/types";

interface SessionsResponse {
  [K: string]: DatabaseSession;
}

const isSession = isObjectOf<Session>({
  id: (value) => isString(value.id),
  dateStarted: (value) => isDateString(value.id),
  dateWillFinish: (value) => isDateString(value.id),
  dateModified: (value) => isDateString(value.dateModified),
  finalEntry: (value) => isString(value.id),
  entries: (value) => isArrayOfStrings(value.parts),
  userId: (value) => isString(value.userId),
  version: (value) => isNumber(value.version),
});

const isSessionsResponse = isKeyedObjectOf<DatabaseSession>(isSession);

function transformSessionsResponse(response: SessionsResponse): Session[] {
  return sortSessions(Object.values(response));
}

function useStoryHistoryListener(storyId: string) {
  const ref = useEntriesRef(storyId);
  const dispatch = useDispatch();
  const [status, setStatus] = React.useState<StoryFetchStatus | null>(null);

  React.useEffect(() => {
    if (!ref) return;

    function setSessionsFromSnapshot(snapshot: firebase.database.DataSnapshot) {
      var data = snapshot.val() as unknown;

      if (data === null || data === undefined) {
        setStatus("FETCHED_NOW_LISTENING");
        return;
      }

      if (!isSessionsResponse(data)) {
        setStatus("INVALID_DATA");
        return;
      }

      const sessionsResponse = data as SessionsResponse;

      setStatus("FETCHED_NOW_LISTENING");

      dispatch(
        actions.sessionIdsByStoryId.setStorySessions({
          storyId,
          sessions: transformSessionsResponse(sessionsResponse),
        })
      );
    }

    const eventType = "value";

    ref.on(eventType, setSessionsFromSnapshot);

    return () => {
      ref.off(eventType, setSessionsFromSnapshot);
    };
  }, [storyId, ref, dispatch]);

  return status;
}

export default useStoryHistoryListener;
