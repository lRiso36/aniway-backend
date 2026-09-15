enum ERROR_MESSAGES {
  UNAUTHORIZED = 'Unauthorized access.',
  BAD_REQUEST = 'Bad request.',
  INVALID_CREDENTIALS = 'Invalid credentials.',
  EXPIRED_TOKEN = 'Token has expired.',
  UNPROCESSABLE_ENTITY = 'Unprocessable entity.',
  SERVER_ERROR = 'Internal server error.',
  CONFLICT = 'Conflict error.',
  NOT_FOUND = 'Resource not found.',
  EMAIL_TAKEN = 'An account with that email already exists',
  USERNAME_TAKEN = 'An account with that username already exists',
  INVALID_TOKEN = 'Invalid or expired verification token',
  SEARCH_FAILED = 'Something went wrong with your search. Please try again.',
  FORBIDDEN = 'You do not have permission to perform this action.',
}

export default ERROR_MESSAGES;
