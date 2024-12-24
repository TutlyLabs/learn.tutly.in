import { io } from 'socket.io-client';

// @ts-ignore
const BACKEND_URL = import.meta.env.PUBLIC_BACKEND_URL || 'http://localhost:4000';

export const socket = io(BACKEND_URL, {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 5
});