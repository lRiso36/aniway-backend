import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

export interface User {
  username: string;
  email: string;
  password: string;
  avatar: string;
  displayName: string;
  bio: string;
  isPrivate: boolean;
  isVerified: boolean;
}
//raw field definition
const userSchema = new mongoose.Schema<User>(
  {
    username: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    avatar: {
      type: String,
      default: '',
    },
    displayName: {
      type: String,
      default: '',
    },
    bio: {
      type: String,
      default: '',
    },
    isPrivate: {
      type: Boolean,
      default: false,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const saltRounds = 10;

userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, saltRounds);
});

//create model
const UserModel = mongoose.model<User>('User', userSchema);

export default UserModel;
