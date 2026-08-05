import logger from '../logs/logger';
import _ from 'lodash';
import bcrypt from 'bcrypt';
import ms from 'ms';
import type { StringValue } from 'ms';
import config from '../config/config';
import { randomBytes, randomUUID } from 'crypto';

import UserModel from '../models/user.model';
import { Request, Response } from 'express';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from '../utils/jwt.util';
import AuthTokenModel from '../models/authToken.model';
import { hashToken } from '../utils/token.util';
import VerificationTokenModel from '../models/verificationToken.model';
import transporter from '../utils/mailer.util';

class AuthController {
  async register(req: Request, res: Response) {
    try {
      const email = req.body.email;
      const username = req.body.username;
      const password = req.body.password;

      if (!email || !username) {
        return res
          .status(400)
          .json({ message: 'Email and username are required' });
      }

      //check if existing
      const existingUser = await UserModel.findOne({
        $or: [{ email }, { username }],
      });

      if (existingUser) {
        const feild = existingUser.email === email ? 'email' : 'username';
        return res.status(409).json({
          message: `${feild} already in use`,
        });
      }

      //register
      const newUser = new UserModel({ username, email, password });
      await newUser.save();

      //verification email token

      try {
        const rawToken = randomBytes(32).toString('hex');

        await VerificationTokenModel.create({
          userId: newUser._id,
          type: 'email_verification',
          token: rawToken,
          expiresAt: new Date(
            Date.now() + ms(config.emailVerificationTtl as StringValue)
          ),
        });

        //verification email
        const verificationLink = `${config.clientUrl}/verify-email?token=${rawToken}`;

        await transporter.sendMail({
          from: config.emailUser,
          to: newUser.email,
          subject: 'Verify your email',
          html: `<p>Click the link below to verify your email:</p><a href="${verificationLink}">${verificationLink}</a>`,
        });
      } catch (error) {
        logger.error('Error creating/sending verification token:', error);
      }

      const userResponse = _.omit(newUser.toObject(), ['password']);

      res.status(201).json({
        message: 'User registered successfully',
        data: userResponse,
      });
    } catch (error) {
      logger.error('Error in register:', error);
      res.status(500).json({
        message: 'Something went wrong',
      });
    }
  }

  async login(req: Request, res: Response) {
    try {
      const email = req.body.email;
      const password = req.body.password;

      if (!email || !password) {
        return res
          .status(400)
          .json({ message: 'Email and password are required' });
      }

      const user = await UserModel.findOne({ email }).select('+password');

      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const userId = user._id.toString();

      const accessToken = signAccessToken(userId);
      const refreshToken = signRefreshToken(userId);

      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: ms(config.refreshTokenTtl as StringValue),
        path: '/',
      });

      await AuthTokenModel.create({
        userId: user._id,
        familyId: randomUUID(),
        token: refreshToken,
        expiresAt: new Date(
          Date.now() + ms(config.refreshTokenTtl as StringValue)
        ),
      });

      res.status(200).json({
        message: 'Login successful',
        accessToken,
        user: {
          id: userId,
          username: user.username,
          email: user.email,
        },
      });
    } catch (error) {
      logger.error('Error in login:', error);
      res.status(500).json({ message: 'Something went wrong' });
    }
  }

  async refresh(req: Request, res: Response) {
    try {
      const refreshToken = req.cookies.refreshToken;

      if (!refreshToken) {
        return res.status(401).json({ message: 'No refresh token provided' });
      }

      try {
        await verifyRefreshToken(refreshToken);
      } catch {
        return res
          .status(401)
          .json({ message: 'Invalid or expired refresh token' });
      }

      const hashedToken = hashToken(refreshToken);
      const tokenDoc = await AuthTokenModel.findOne({ token: hashedToken });
      console.log('Looking for hash:', hashedToken);
      console.log('Found doc:', tokenDoc);

      if (!tokenDoc) {
        return res.status(401).json({ message: 'Invalid refresh token' });
      }

      if (tokenDoc.revoked) {
        await AuthTokenModel.updateMany(
          { familyId: tokenDoc.familyId, revoked: false },
          { revoked: true }
        );
        return res
          .status(401)
          .json({ message: 'Refresh token reuse detected' });
      }

      const userId = tokenDoc.userId.toString();

      const newAccessToken = signAccessToken(userId);
      const newRefreshToken = signRefreshToken(userId);

      tokenDoc.revoked = true;
      await tokenDoc.save();

      await AuthTokenModel.create({
        userId: userId,
        familyId: tokenDoc.familyId,
        token: newRefreshToken,
        expiresAt: new Date(
          Date.now() + ms(config.refreshTokenTtl as StringValue)
        ),
      });

      res.cookie('refreshToken', newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: ms(config.refreshTokenTtl as StringValue),
        path: '/',
      });

      res.status(200).json({
        accessToken: newAccessToken,
      });
    } catch (error) {
      logger.error('Error in refresh:', error);
      res.status(500).json({ message: 'Something went wrong' });
    }
  }

  async verifyEmail(req: Request, res: Response) {
    try {
      const { token } = req.body;

      if (!token) {
        return res
          .status(400)
          .json({ message: 'Verification token is required' });
      }

      //hash token and look it up
      const hashedToken = hashToken(token);
      const tokenDoc = await VerificationTokenModel.findOne({
        token: hashedToken,
        type: 'email_verification',
      });

      if (!tokenDoc) {
        return res
          .status(400)
          .json({ message: 'Invalid or expired verification token' });
      }

      //update verified and delete used token
      await UserModel.findByIdAndUpdate(tokenDoc.userId, { isVerified: true });

      await VerificationTokenModel.deleteOne({ _id: tokenDoc._id });

      res.status(200).json({ message: 'Email veriified successfully' });
    } catch (error) {
      logger.error('Error in verifyEmail:', error);
      res.status(500).json({ message: 'Something went wrong' });
    }
  }

  async forgotPassword(req: Request, res: Response) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ message: 'Email is required' });
      }

      const user = await UserModel.findOne({ email });

      if (user) {
        try {
          await VerificationTokenModel.deleteMany({
            userId: user._id,
            type: 'password_reset',
          });

          const rawToken = randomBytes(32).toString('hex');

          await VerificationTokenModel.create({
            userId: user._id,
            type: 'password_reset',
            token: rawToken,
            expiresAt: new Date(
              Date.now() + ms(config.passwordResetTtl as StringValue)
            ),
          });

          const resetLink = `${config.clientUrl}/reset-password?token=${rawToken}`;

          await transporter.sendMail({
            from: config.emailUser,
            to: user.email,
            subject: 'Reset your password',
            html: `<p>Click the link below to reset your password:</p><a href="${resetLink}">${resetLink}</a>`,
          });
        } catch (error) {
          logger.error('Error creating/sending password reset token:', error);
        }
      }

      res.status(200).json({
        message:
          'If an account with that email exists, a reset link has been sent.',
      });
    } catch (error) {
      logger.error('Error in forgotPassword:', error);
      res.status(500).json({ message: 'Something went wrong' });
    }
  }

  async resetPassword(req: Request, res: Response) {
    try {
      const { token } = req.body;
      const { newPassword } = req.body;

      if (!token) {
        return res
          .status(400)
          .json({ message: 'Verification token is required' });
      }

      if (!newPassword) {
        return res.status(400).json({ message: 'New password is required' });
      }

      //hash token and look it up
      const hashedToken = hashToken(token);
      const tokenDoc = await VerificationTokenModel.findOne({
        token: hashedToken,
        type: 'password_reset',
      });

      if (!tokenDoc) {
        return res
          .status(400)
          .json({ message: 'Invalid or expired verification token' });
      }

      //update password
      const user = await UserModel.findById(tokenDoc.userId);

      if (!user) {
        return res
          .status(400)
          .json({ message: 'Invalid or expired verification token' });
      }

      user.password = newPassword;
      await user.save();

      //delete token
      await VerificationTokenModel.deleteOne({ _id: tokenDoc._id });

      //revoke all sessions and force login
      await AuthTokenModel.updateMany(
        { userId: tokenDoc.userId, revoked: false },
        { revoked: true }
      );

      res.status(200).json({ message: 'Password successfully reset' });
    } catch (error) {
      logger.error('Error in resetPassword:', error);
      res.status(500).json({ message: 'Something went wrong' });
    }
  }
}

export default new AuthController();
