import io from 'socket.io-client';
import { API_URL, getToken } from './api';

let socket = null;

/**
 * One shared authenticated socket for the whole app.
 *
 * React 18 StrictMode mounts effects twice in development, so components must
 * not each open their own connection — they share this one and only the last
 * `release()` actually disconnects.
 */
let holders = 0;

export function acquireSocket() {
  holders += 1;

  if (!socket) {
    socket = io(API_URL, {
      auth: { token: getToken() },
      transports: ['websocket', 'polling'],
    });
  }

  return socket;
}

export function releaseSocket() {
  holders = Math.max(0, holders - 1);

  if (holders === 0 && socket) {
    socket.disconnect();
    socket = null;
  }
}

/** Drops the connection outright, e.g. on logout so the token is not reused. */
export function resetSocket() {
  holders = 0;
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
