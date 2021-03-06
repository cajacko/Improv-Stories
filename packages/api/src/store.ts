import { Socket } from "socket.io";
import { v4 as uuid } from "uuid";
import { User, Story, ServerSession, UserDetails } from "./sharedTypes";
import logger from "./logger";

export type ChangedStories = string[];

export interface StoreUser extends User {
  socket: Socket;
  connectedStories: {
    [K: string]: true | undefined;
  };
}

export interface StoreSession {
  id: string;
  user: string;
  dateStarted: string;
  dateWillFinish: string;
  finalEntry: string;
  entries: string[];
  dateModified: string;
  version: number;
  dateFinished: null | string;
  finishedEarly?: boolean;
}

export interface StoreStory {
  id: string;
  connectedUsers: { [K: string]: true | undefined };
  activeUsers: { [K: string]: true | undefined };
  lastSession: null | StoreSession;
  activeSession: null | StoreSession;
  dateCreated: string;
  dateModified: string;
  version: number;
}

let usersById: { [K: string]: StoreUser | undefined } = {};
let storiesById: { [K: string]: StoreStory | undefined } = {};

const defaultDateFunction = () => new Date().toISOString();
const defaultGetId = () => uuid();
let getDate: () => string = defaultDateFunction;
let getId: () => string = defaultGetId;

export function getGetId() {
  return getId;
}

export function getGetDate() {
  return getDate;
}

export function getUser(userId: string): StoreUser | null {
  return usersById[userId] || null;
}

function createNewStory(
  storyId: string,
  story: Partial<StoreStory> = {}
): StoreStory {
  const date = getDate();

  const newStory: StoreStory = {
    id: storyId,
    connectedUsers: {},
    activeUsers: {},
    lastSession: null,
    activeSession: null,
    dateCreated: date,
    dateModified: date,
    version: 1,
    ...story,
  };

  storiesById[storyId] = newStory;

  return newStory;
}

export function getStoreStory(storyId: string) {
  return storiesById[storyId] || null;
}

function getStoryOrCreate(storyId: string): StoreStory {
  return getStoreStory(storyId) || createNewStory(storyId);
}

function getUserStories(userId: string): StoreStory[] {
  const user = usersById[userId];

  if (!user) return [];

  return Object.keys(user.connectedStories).map(getStoryOrCreate);
}

function sessionHasChanged(
  session: StoreSession,
  {
    dateModified,
    version,
    dateFinished,
  }: { dateModified?: string; version?: number; dateFinished?: string } = {}
) {
  return {
    ...session,
    dateModified: dateModified || getDate(),
    version: version || session.version + 1,
    dateFinished: dateFinished || session.dateFinished,
  };
}

function userHasChanged(
  userId: string,
  { dateModified, version }: { dateModified?: string; version?: number } = {}
): ChangedStories {
  const user = usersById[userId];

  if (!user) return [];

  usersById[userId] = {
    ...user,
    dateModified: dateModified || getDate(),
    version: version || user.version + 1,
  };

  return getUserStories(userId).map((story) => {
    storyHasChanged(story.id);

    return story.id;
  });
}

function storyHasChanged(
  storyId: string,
  { dateModified, version }: { dateModified?: string; version?: number } = {}
): ChangedStories {
  const story = getStoryOrCreate(storyId);

  storiesById[storyId] = {
    ...story,
    dateModified: dateModified || getDate(),
    version: version || story.version + 1,
  };

  return [storyId];
}

export function addUserToStory(
  userId: string,
  storyId: string,
  isActive: boolean
): ChangedStories {
  const story = getStoryOrCreate(storyId);
  const storeUser = usersById[userId];

  if (!storeUser) return removeStoryUser(userId, storyId);

  story.connectedUsers[userId] = true;
  storeUser.connectedStories[storyId] = true;

  if (isActive) {
    story.activeUsers[userId] = true;
  } else {
    delete story.activeUsers[userId];
  }

  return storyHasChanged(storyId);
}

export function addActiveUserToStory(
  userId: string,
  storyId: string
): ChangedStories {
  return addUserToStory(userId, storyId, true);
}

export function removeActiveUserFromStory(
  userId: string,
  storyId: string
): ChangedStories {
  return addUserToStory(userId, storyId, false);
}

export function removeUser(userId: string) {
  const changedStoryIds = getUserStories(userId).map(({ id }) => {
    removeStoryUser(userId, id);

    return id;
  });

  delete usersById[userId];

  return changedStoryIds;
}

export function addUser(user: StoreUser): ChangedStories {
  const existingUser = usersById[user.id];
  let changedStoryIds: string[] = [];

  if (existingUser) {
    removeUser(existingUser.id);
  }

  usersById[user.id] = user;

  return changedStoryIds;
}

export function setUser(
  userId: string,
  userDetails: UserDetails
): ChangedStories {
  if (userId !== userId) return [];

  const storeUser = usersById[userId];

  if (!storeUser) return [];

  storeUser.name = userDetails.name;

  return userHasChanged(userId);
}

export function removeStoryUser(
  userId: string,
  storyId: string
): ChangedStories {
  const story = getStoryOrCreate(storyId);
  const storeUser = usersById[userId];

  removeActiveUserFromStory(userId, storyId);
  delete story.connectedUsers[userId];

  if (storeUser) {
    delete storeUser.connectedStories[storyId];
  }

  return storyHasChanged(storyId);
}

export function finishActiveStorySession(storyId: string): ChangedStories {
  const story = getStoryOrCreate(storyId);

  const activeSession = story.activeSession;

  logger.log("finishActiveStorySession", { storyId, activeSession });

  if (activeSession) {
    story.lastSession = sessionHasChanged(activeSession, {
      dateFinished: getDate(),
    });
  }

  story.activeSession = null;

  return storyHasChanged(storyId);
}

export function startNewStorySession(
  session: StoreSession,
  storyId: string
): ChangedStories {
  finishActiveStorySession(storyId);

  const story = getStoryOrCreate(storyId);

  story.activeSession = session;

  logger.log("startNewStorySession", { storyId, session });

  return storyHasChanged(storyId);
}

export function setSessionText(
  userId: string,
  storyId: string,
  entry: string
): StoreSession | null {
  const story = getStoryOrCreate(storyId);

  if (!story.activeSession) return null;
  if (userId !== story.activeSession.user) return null;

  story.activeSession.entries.push(entry);
  story.activeSession.finalEntry = entry;

  story.activeSession = sessionHasChanged(story.activeSession);

  storyHasChanged(storyId);

  return story.activeSession;
}

function userIdToUser(userId: string): User {
  const storeUser = usersById[userId];

  const user: User = storeUser
    ? {
        id: storeUser.id,
        name: storeUser.name,
        dateAdded: storeUser.dateAdded,
        dateModified: storeUser.dateModified,
        version: storeUser.version,
      }
    : {
        id: userId,
        name: null,
        dateAdded: getDate(),
        dateModified: getDate(),
        version: 0,
      };

  return user;
}

function userIdsToUsers(userIds: string[]): User[] {
  return userIds.map(userIdToUser);
}

export function getSession(session: StoreSession | null): ServerSession | null {
  if (!session) return null;

  return {
    ...session,
    user: userIdToUser(session.user),
  };
}

export function getStory(storyId: string): Story {
  const story = getStoryOrCreate(storyId);

  return {
    ...story,
    connectedUsers: userIdsToUsers(Object.keys(story.connectedUsers)),
    activeUsers: userIdsToUsers(Object.keys(story.activeUsers)),
    activeSession: getSession(story.activeSession),
    lastSession: getSession(story.lastSession),
  };
}

export function __TESTS__getStore() {
  return {
    usersById,
    storiesById,
  };
}

export function __TESTS__reset() {
  getDate = defaultDateFunction;
  usersById = {};
  storiesById = {};
}

export function __TESTS__setGetDate(newGetDate: () => string) {
  getDate = newGetDate;
}

export function __TESTS__setGetId(newGetId: () => string) {
  getId = newGetId;
}
