import BaseController from './base.controller';
import UserModel, { User } from '../models/user.model';

class UsersController extends BaseController<User> {
  constructor() {
    super(UserModel);
  }

  method() {
    // this.logger.info("hello world")
    // this._.map([1, 2, 3], (n) => n * 2);
  }
}

const usersController = new UsersController();

export default usersController;
