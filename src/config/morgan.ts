import morgan, { type StreamOptions } from 'morgan';
import Logger from './logger.js';

const stream: StreamOptions = {
  write: (message) => Logger.http(message.trim()),
};

const morganMiddleware = morgan(
  ':method :url :status :res[content-length] - :response-time ms :remote-addr',
  { stream },
);

export default morganMiddleware;
