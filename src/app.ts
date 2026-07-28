import express from 'express';
import cors from 'cors';
import userRoutes from './routes/users.routes';
import pushSubscriptionRoutes from './routes/pushSubscription.routes';

const app = express();

app.use(
  cors({
    origin: '*',
  })
);
app.use(express.json());

app.get('/', (_req, res) => {
  res.send('Aniway API is running');
});

app.use('/users', userRoutes);
app.use('/push', pushSubscriptionRoutes);

export default app;
