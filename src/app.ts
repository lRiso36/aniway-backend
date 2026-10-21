import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
// import config from './config/config';
// import userRoutes from './routes/api/v1/users.routes';
// import pushSubscriptionRoutes from './routes/api/v1/pushSubscription.routes';
import { morganStream } from './logs/logger';
import routes from './routes';
import registry from './app.registry';

import emailsController from './controllers/emails.controller';
import usersController from './controllers/users.controller';
import userModel from './models/user.model';
import config from './config/config';

const app = express();

app.use(
  cors({
    origin: [config.frontendUrl, config.adminUrl],
    credentials: true,
  })
);
app.use(morgan('dev', { stream: morganStream }));
app.use(express.json());
app.use(cookieParser());

// register controllers
registry.register('emailsController', emailsController);
registry.register('usersController', usersController);

// register models
registry.register('userModel', userModel);

app.use(routes);

app.get('/', (_req, res) => {
  res.send('Aniway API is running');
});

// app.use('/users', userRoutes);
// app.use('/push', pushSubscriptionRoutes);

export default app;
