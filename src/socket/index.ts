import { Server } from 'socket.io';
import http from 'node:http';
import { setSocketIO } from './socket.instance.js';
import Logger from '@config/logger.js';
import { registerNotificationEvents } from './events/notification.events.js';
// import { registerBlogEvents } from './events/blog.events';

export const initSocket = (server: http.Server) => {
  const io = new Server(server, {
    cors: {
      origin: '*',
      credentials: true,
    },
  });

  setSocketIO(io);

  io.on('connection', (socket) => {
    Logger.info(`Socket connected: ${socket.id}`);

    registerNotificationEvents(socket, io);

    socket.on('disconnect', () => {
      Logger.info(`Socket disconnected: ${socket.id}`);
    });
  });
};
