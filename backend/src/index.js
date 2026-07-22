import 'dotenv/config';
import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { Server as SocketIOServer } from 'socket.io';

import { sequelize } from './models/index.js';
import SocketHub from './sockets/SocketHub.js';
import errorHandler from './middleware/errorHandler.js';

import authRoutes from './routes/auth.js';
import positionRoutes from './routes/positions.js';
import attributeRoutes from './routes/attributes.js';
import userRoutes from './routes/users.js';
import cvRoutes from './routes/cvs.js';
import discussionRoutes from './routes/discussions.js';
import statsRoutes from './routes/stats.js';
import searchRoutes from './routes/search.js';

class Application {
  constructor() {
    this.app = express();
    this.server = http.createServer(this.app);
    this.io = new SocketIOServer(this.server, {
      cors: {
        origin: process.env.CLIENT_URL || '*',
        credentials: true
      }
    });
  }

  configureMiddleware() {
    this.app.use(helmet({ crossOriginResourcePolicy: false }));
    this.app.use(cors({
      origin: process.env.CLIENT_URL || '*',
      credentials: true
    }));
    this.app.use(express.json());
    if (process.env.NODE_ENV !== 'production') this.app.use(morgan('dev'));
  }

  configureRoutes() {
    this.app.use('/api/auth', authRoutes);
    this.app.use('/api/positions', positionRoutes);
    this.app.use('/api/attributes', attributeRoutes);
    this.app.use('/api/users', userRoutes);
    this.app.use('/api/cvs', cvRoutes);
    this.app.use('/api/discussions', discussionRoutes);
    this.app.use('/api/stats', statsRoutes);
    this.app.use('/api/search', searchRoutes);
    this.app.use(errorHandler);
  }

  configureSockets() {
    SocketHub.attach(this.io);
  }

  async start() {
    this.configureMiddleware();
    this.configureRoutes();
    this.configureSockets();
    await sequelize.authenticate();
    await sequelize.sync({ alter: true });
    const port = process.env.PORT || 5000;
    this.server.listen(port, () => process.stdout.write(`Server listening on port ${port}\n`));
  }
}

new Application().start().catch((err) => {
  process.stderr.write(`Failed to start application: ${err.stack || err}\n`);
  process.exit(1);
});