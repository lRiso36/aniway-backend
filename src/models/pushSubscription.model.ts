import mongoose from 'mongoose';

export interface PushSubscription {
  userId: mongoose.Types.ObjectId;
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

const pushSubscriptionSchema = new mongoose.Schema<PushSubscription>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    endpoint: {
      type: String,
      required: true,
      unqiue: true,
    },
    keys: {
      p256dh: {
        type: String,
        required: true,
      },
      auth: {
        type: String,
        required: true,
      },
    },
  },
  { timestamps: true }
);

const PushSubscriptionModel = mongoose.model<PushSubscription>(
  'PushSubscription',
  pushSubscriptionSchema
);

export default PushSubscriptionModel;
