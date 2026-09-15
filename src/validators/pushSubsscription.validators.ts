import { z } from 'zod';

export const SaveSubscriptionSchema = z.object({
  endpoint: z.string().url('Endpoint must be a valid URL'),
  keys: z.object({
    p256dh: z.string().min(1, 'p256dh key is required'),
    auth: z.string().min(1, 'auth key is required'),
  }),
});
