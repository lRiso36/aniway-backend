import mongoose, { Schema, Types } from 'mongoose';

export interface AuthToken {
  userId: Types.ObjectId;
  token: string;
  createdAt: Date;
  updatedAt: Date;
}

const authTokenSchema = new Schema<AuthToken>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    token: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const AuthTokenModel = mongoose.model<AuthToken>('AuthToken', authTokenSchema);

export default AuthTokenModel;
