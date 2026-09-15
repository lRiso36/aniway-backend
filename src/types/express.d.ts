export {};

declare global {
  namespace Express {
    interface Request {
      meta?: {
        user?: {
          _id: string;
          role: 'admin' | 'user';
        };
      };
    }
  }
}
