import { Server } from 'socket.io';

let io: Server | null = null;

export const setSocketIO = (ioInstance: Server) => {
  io = ioInstance;
};

export const getSocketIO = (): Server => {
  if (!io) {
    throw new Error('Socket.IO not initialized');
  }
  return io;
};
