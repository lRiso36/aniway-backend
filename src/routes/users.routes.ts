import { Router } from 'express';
import usersController from '../controllers/users.controller';

const router = Router();

// router.route("/")
//   .post(usersController.create.bind(usersController))
//   .get(usersController.list.bind(usersController));

// router.route("/:id")
//   .get(usersController.getById.bind(usersController))
//   .patch(usersController.update.bind(usersController))
//   .delete(usersController.delete.bind(usersController));

router.post('/', usersController.create.bind(usersController));
router.get('/', usersController.list.bind(usersController));
router.get('/:id', usersController.getById.bind(usersController));
router.patch('/:id', usersController.update.bind(usersController));
router.delete('/:id', usersController.delete.bind(usersController));

export default router;
