import { Router } from 'express';
import usersController from '../../../controllers/users.controller';
import { handleAvatarUpload } from '../../../middlewares/upload';
import { authMiddleware } from '../../../middlewares';

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
router.patch('/', usersController.updateUser.bind(usersController));
router.get('/me', authMiddleware, usersController.me.bind(usersController));

router.patch(
  '/avatar',
  authMiddleware,
  handleAvatarUpload,
  usersController.updateAvatar.bind(usersController)
);

router.delete(
  '/delete-account',
  authMiddleware,
  usersController.deleteAccount.bind(usersController)
);
router.get('/:id', usersController.getById.bind(usersController));
router.put('/:id', usersController.update.bind(usersController));
router.delete('/:id', usersController.removeUser.bind(usersController));

export default router;
