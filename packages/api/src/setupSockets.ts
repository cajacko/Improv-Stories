import * as socket from "socket.io";
import { broadCastStoriesChanged, broadCastUserStories } from "./broadcast";
import { addUser, removeUser, getGetDate } from "./store";
import { ClientMessage } from "./sharedTypes";
import handleClientMessage from "./handleClientMessage";
import logger from "./logger";

function setupSockets(io: socket.Server) {
  function onClientMessage(userId: string) {
    return (message: ClientMessage) => {
      handleClientMessage(userId, message);
    };
  }

  function onSocketConnect(sock: socket.Socket, userId: string) {
    logger.log("Socket connected", { userId });

    const date = getGetDate()();

    const changedStoryIds = addUser({
      id: userId,
      name: null,
      dateAdded: date,
      dateModified: date,
      connectedStories: {},
      version: 0,
      socket: sock,
    });

    broadCastStoriesChanged(changedStoryIds, "LIVE_STORY_STORY_CHANGED");

    sock.on("message", onClientMessage(userId));
  }

  function onSocketDisconnect(userId: string) {
    logger.log("Socket disconnected", { userId });

    const changedStoryIds = removeUser(userId);

    broadCastStoriesChanged(changedStoryIds, "LIVE_STORY_STORY_CHANGED");
  }

  function getUserIdFromSocket(sock: socket.Socket) {
    if (!sock) return null;
    if (!sock.request) return null;
    if (!sock.request._query) return null;
    if (!sock.request._query.user_id) return null;

    return sock.request._query.user_id;
  }

  io.on("connection", (sock) => {
    // The only place we grab the user id
    const userId = getUserIdFromSocket(sock);

    if (!userId) {
      sock.disconnect(true);
      return;
    }

    onSocketConnect(sock, userId);

    const interval = setInterval(() => {
      broadCastUserStories(userId, "LIVE_STORY_STORY_CHANGED");
    }, 1000);

    sock.on("disconnect", () => {
      onSocketDisconnect(userId);
      clearInterval(interval);
    });
  });
}

export default setupSockets;
