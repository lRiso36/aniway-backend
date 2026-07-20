import express from 'express';
import cors from 'cors';

import usersController from './controllers/users.controller';


const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (_req, res) => {
  res.send('Aniway API is running');
});

app.post("/users", usersController.create.bind(usersController));
app.get("/users", usersController.list.bind(usersController));
app.get("/users/:id", usersController.getById.bind(usersController));
app.patch("/users/:id", usersController.update.bind(usersController));
app.delete("/users/:id", usersController.delete.bind(usersController));


export default app;