/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-unused-vars */
import Logger from '@config/logger.js';
import { Server, Socket } from 'socket.io';

export const registerNotificationEvents = (socket: Socket, io: Server) => {
  socket.on('publisher:room', (publisherId: string) => {
    socket.join(`publisher:${publisherId}`);
    Logger.info(`Publisher joined room publisher:${publisherId}`);
  });

  socket.on('admin:room', (adminId: string) => {
    socket.join(`admin:${adminId}`);
    Logger.info(`Admin joined room admin:${adminId}`);
  });

  socket.on('author:room', (authorId: string) => {
    socket.join(`author:${authorId}`);
    Logger.info(`Author joined room author:${authorId}`);
  });

  socket.on('client:room', (clientId: string) => {
    socket.join(`client:${clientId}`);
    Logger.info(`Client joined room client:${clientId}`);
  });

  socket.on('joinBlog', (blogId: string) => {
    socket.join(`blog:${blogId}`);
    Logger.info(`blog details joined room:${blogId}`);
  });
};
