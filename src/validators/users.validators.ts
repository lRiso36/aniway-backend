import * as z from 'zod';

// export const AvatarFileSchema = z.object({
//   fieldname: z.literal('avatar'),
//   mimetype: z.enum(['image/jpeg', 'image/png', 'image/webp']),
//   size: z.number().max(2 * 1024 * 1024, "File too large. Maximum size is 2MB."),
// });

import { isValidObjectId } from 'mongoose';
import { usernameSchema } from './auth.validator';

export const UpdateUserSchema = z.object({
  id: z.string().refine(isValidObjectId, 'Invalid user id'),
  username: usernameSchema,
  email: z.string().email(),
  displayName: z.string().max(50),
  bio: z.string().max(500),
  avatar: z.string(),
  isPrivate: z.boolean(),
  isVerified: z.boolean(),
});