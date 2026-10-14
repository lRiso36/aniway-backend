import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

export interface User {
  username: string;
  googleId?: string;
  email: string;
  password?: string;
  avatar: string;
  displayName: string;
  bio: string;
  isPrivate: boolean;
  isVerified: boolean;
  role: 'admin' | 'user';
}
//raw field definition
const userSchema = new mongoose.Schema<User>(
  {
    username: {
      type: String,
      required: true,
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
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
    role: {
      type: String,
      enum: ['admin', 'user'],
      required: true,
      default: 'user',
    },
  },
  { timestamps: true }
);

const saltRounds = 10;

userSchema.pre('save', async function () {
  if (!this.password || !this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, saltRounds);
});

userSchema.index(
  { username: 1 },
  { unique: true, collation: { locale: 'en', strength: 2 } }
);

//create model
const UserModel = mongoose.model<User>('User', userSchema);

export default UserModel;
