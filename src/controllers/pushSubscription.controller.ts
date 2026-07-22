import { Request, Response } from 'express';
import PushSubscriptionModel from '../models/pushSubscription.model';

export const saveSubscripton = async (req: Request, res: Response) => {
  try {
    const { endpoint, keys, userId } = req.body;
    // const userId = req.user?._id; //add this once we do auth

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return res.status(400).json({ message: 'Invalid subscription object' });
    }

    if (!userId) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    //want upsert in case someone logged into different account and userId changed
    await PushSubscriptionModel.findOneAndUpdate(
      { endpoint },
      { endpoint, keys, userId },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.status(201).json({ message: 'Subscription saved successfully' });
  } catch (err) {
    console.error('Error saving push subscription:', err);
    res.status(500).json({ message: 'Failed to save subscription' });
  }
};
