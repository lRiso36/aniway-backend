import { OAuth2Client } from 'google-auth-library';
import config from '../config/config';
import ERROR_MESSAGES from '../constants/error-messages';

const client = new OAuth2Client(config.googleClientId);

export async function verifyGoogleCredential(credential: string) {
  let ticket;
  try {
    ticket = await client.verifyIdToken({
      idToken: credential,
      audience: config.googleClientId,
    });
  } catch {
    throw new Error(ERROR_MESSAGES.INVALID_GOOGLE_CREDENTIALS);
  }
  const payload = ticket.getPayload();

  if (!payload || !payload.email || !payload.email_verified) {
    throw new Error(ERROR_MESSAGES.INVALID_GOOGLE_CREDENTIALS);
  }

  return {
    googleId: payload.sub,
    email: payload.email,
    name: payload.name,
    picture: payload.picture,
  };
}
