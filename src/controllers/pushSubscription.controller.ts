import { Request, Response } from 'express';
import PushSubscriptionModel from '../models/pushSubscription.model';
import { SaveSubscriptionSchema } from '../validators/pushSubsscription.validators';
import errorHandler from '../utils/error-handler.util';

export const saveSubscripton = async (req: Request, res: Response) => {
  try {
    const { endpoint, keys } = SaveSubscriptionSchema.parse(req.body);
    const userId = req.meta?.user?._id;

    //want upsert in case someone logged into different account and userId changed
    await PushSubscriptionModel.findOneAndUpdate(
      { endpoint },
      { endpoint, keys, userId },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.status(201).json({ message: 'Subscription saved successfully' });
  } catch (err) {
    errorHandler(err as Error, req, res);
  }
};
