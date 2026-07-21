import BaseController from './base.controller';
import UserModel, { User } from '../models/user.model';

class UsersController extends BaseController<User> {
  constructor() {
    super(UserModel);
  }
}

const usersController = new UsersController();

export default usersController;
