import { USERNAME_COLLATION } from '../constants/username-coalition';
import UserModel from '../models/user.model';

export async function isUsernameAvailable(username: string) {
  const taken = await UserModel.exists({ username }).collation(
    USERNAME_COLLATION
  );
  return !taken;
}
