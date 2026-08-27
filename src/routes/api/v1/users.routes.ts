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

router.get(
  '/me',
  authMiddleware,
  (req, res, next) => {
    console.log('TIMESTAMP', new Date().toISOString());
    next();
  },
  usersController.me.bind(usersController)
);

router.patch(
  '/avatar',
  handleAvatarUpload,
  usersController.updateAvatar.bind(usersController)
);
router.get('/:id', usersController.getById.bind(usersController));
router.patch('/:id', usersController.update.bind(usersController));
router.delete('/:id', usersController.delete.bind(usersController));

export default router;
