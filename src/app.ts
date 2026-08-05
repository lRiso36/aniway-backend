import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';

// import userRoutes from './routes/api/v1/users.routes';
// import pushSubscriptionRoutes from './routes/api/v1/pushSubscription.routes';
import { morganStream } from './logs/logger';
import routes from './routes';

const app = express();

app.use(
  cors({
    origin: 'http://localhost:5174',
    credentials: true,
  })
);
app.use(morgan('dev', { stream: morganStream }));
app.use(express.json());
app.use(cookieParser());

app.use(routes);

app.get('/', (_req, res) => {
  res.send('Aniway API is running');
});

// app.use('/users', userRoutes);
// app.use('/push', pushSubscriptionRoutes);

export default app;
