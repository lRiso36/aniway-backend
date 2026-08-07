import multer, { MulterError } from 'multer';
import { Request, Response, NextFunction } from 'express';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 2 * 1024 * 1024,
  },
});

export const handleAvatarUpload = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  upload.single('avatar')(req, res, (err) => {
    if (err instanceof MulterError && err.code === 'LIMIT_FILE_SIZE') {
      return res
        .status(400)
        .json({ message: 'File too large. Maximum size is 2MB.' });
    }
    if (err) {
      return res.status(400).json({ message: err.message });
    }
    next();
  });
};

export default upload;
