import { io } from 'socket.io-client';
import { getToken, getUser } from './auth';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';
let socket;

export function getSocket() {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ['websocket'],
      auth: {
        token: getToken()
      }
    });

    const user = getUser();
    if (user?.tenantId) {
      socket.emit('join-tenant', user.tenantId);
    }
  }
  return socket;
}

export const socketClient = getSocket;
