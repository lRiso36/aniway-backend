import mongoose, { Schema, Types } from 'mongoose';
import { hashToken } from '../utils/token.util';

export type VerificationTokenType = 'email_verification' | 'password_reset';

export interface VerificationToken {
  userId: Types.ObjectId;
  type: VerificationTokenType;
  token: string;
  expiresAt: Date;
}

const verificationTokenSchema = new Schema<VerificationToken>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  type: {
    type: String,
    enum: ['email_verification', 'password_reset'],
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
});

verificationTokenSchema.pre('save', async function () {
  if (!this.isModified('token')) return;
  this.token = hashToken(this.token);
});

const VerificationTokenModel = mongoose.model<VerificationToken>(
  'VerificationToken',
  verificationTokenSchema
);

export default VerificationTokenModel;
