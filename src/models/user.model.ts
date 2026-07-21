import mongoose, { InferSchemaType, HydratedDocument } from 'mongoose';
import bcrypt from 'bcrypt';

//avatar defaults to default avatar on frontend
//display name defaults to username on frotnend if empty

//raw field definition
const userSchemaDefinition = {
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
} as const;

const userSchema = new mongoose.Schema(userSchemaDefinition, {
  timestamps: true,
});

//plain data shape
export type User = InferSchemaType<typeof userSchema>;

//hydrate it
export type UserDocument = HydratedDocument<User>;

const saltRounds = 10;

//should there be try catch?
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, saltRounds);
});

//create model
const UserModel = mongoose.model<User>('User', userSchema);

export default UserModel;
