import mongoose, { Schema, Types } from 'mongoose';

import { hashToken } from '../utils/token.util';

//do we need types? is expires at a date or string
export interface AuthToken {
  userId: Types.ObjectId;
  familyId: string;
  token: string;
  expiresAt: Date;
  revoked: boolean;
}

const authTokenSchema = new Schema<AuthToken>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  familyId: {
    type: String,
    required: true,
  },
  token: {
    type: String,
    required: true,
  },
  expiresAt: {
    type: Date,
    required: true,
    expires: 0,
  },
  revoked: {
    type: Boolean,
    required: true,
    default: false,
  },
});

authTokenSchema.pre('save', async function () {
  if (!this.isModified('token')) return;
  this.token = hashToken(this.token);
});

const AuthTokenModel = mongoose.model<AuthToken>('AuthToken', authTokenSchema);

export default AuthTokenModel;
