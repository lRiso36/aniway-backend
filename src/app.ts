import express from 'express';
import cors from 'cors';
import userRoutes from './routes/users.routes';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (_req, res) => {
  res.send('Aniway API is running');
});

app.use('/users', userRoutes);

export default app;
