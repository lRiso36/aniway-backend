import mongoose, { Schema, Types } from 'mongoose';
//maybe add hashing

//do we need types? is expires at a date or string
export interface AuthToken {
  userId: Types.ObjectId;
  token: string;
  expiresAt: Date;
}

const authTokenSchema = new Schema<AuthToken>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
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

const AuthTokenModel = mongoose.model<AuthToken>('AuthToken', authTokenSchema);

export default AuthTokenModel;
