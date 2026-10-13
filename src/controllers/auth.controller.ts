import logger from '../logs/logger';
import bcrypt from 'bcrypt';
import ms from 'ms';
import type { StringValue } from 'ms';
import config from '../config/config';
import { randomBytes } from 'crypto';
import { Request, Response } from 'express';

import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from '../utils/jwt.util';
import AuthTokenModel, { AuthToken } from '../models/authToken.model';
import { hashToken } from '../utils/token.util';
import VerificationTokenModel from '../models/verificationToken.model';
import BaseController from './base.controller';
import {
  ForgotPasswordSchema,
  LoginSchema,
  RegisterSchema,
  ResetPasswordSchema,
  VerifyEmailSchema,
} from '../validators/auth.validator';

class AuthController extends BaseController<AuthToken> {
  constructor() {
    super(AuthTokenModel);
  }

  async register(req: Request, res: Response) {
    const UserModel = this.registry.get('userModel');

    try {
      const { email, username, password } = RegisterSchema.parse(req.body);

      //check if existing
      const existingUser = await UserModel.findOne({
        $or: [{ email }, { username }],
      });

      if (existingUser) {
        if (existingUser.email === email) {
          throw new Error(this.ERROR_MESSAGES.EMAIL_TAKEN);
        } else {
          throw new Error(this.ERROR_MESSAGES.USERNAME_TAKEN);
        }
      }

      //register
      const newUser = new UserModel({ username, email, password });
      await newUser.save();

      //verification email token
      const { accessToken, refreshToken } = this.jwtUtil.signTokens(
        newUser._id.toString()
      );

      const newAuthToken = new this.model({
        userId: newUser._id,
        token: refreshToken,
      });

      // const savedAuthToken = await newAuthToken.save();
      await newAuthToken.save();

      this.broker.emit('user:registered', {
        userId: newUser._id.toString(),
        email: newUser.email,
      });

      res.status(201).json({
        message: 'User registered successfully',
        data: {
          accessToken,
          refreshToken,
        },
      });

      // try {
      //   const rawToken = randomBytes(32).toString('hex');

      //   await VerificationTokenModel.create({
      //     userId: newUser._id,
      //     type: 'email_verification',
      //     token: rawToken,
      //     expiresAt: new Date(
      //       Date.now() + ms(config.emailVerificationTtl as StringValue)
      //     ),
      //   });

      //   //verification email
      //   const verificationLink = `${config.clientUrl}/verify-email?token=${rawToken}`;

      //   await transporter.sendMail({
      //     from: config.emailUser,
      //     to: newUser.email,
      //     subject: 'Verify your email',
      //     html: `<p>Click the link below to verify your email:</p><a href="${verificationLink}">${verificationLink}</a>`,
      //   });
      // } catch (error) {
      //   logger.error('Error creating/sending verification token:', error);
      // }

      // const userResponse = _.omit(newUser.toObject(), ['password']);

      // res.status(201).json({
      //   message: 'User registered successfully',
      //   data: userResponse,
      // });
    } catch (error) {
      this.errorHandler(error as Error, req, res);
    }
  }

  async login(req: Request, res: Response) {
    const UserModel = this.registry.get('userModel');

    try {
      const { email, password } = LoginSchema.parse(req.body);

      const user = await UserModel.findOne({ email }).select('+password');

      if (!user || !user.password) {
        throw new Error(this.ERROR_MESSAGES.INVALID_CREDENTIALS);
      }

      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        throw new Error(this.ERROR_MESSAGES.INVALID_CREDENTIALS);
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

      res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: ms(config.tokenTtl as StringValue),
      });

      const authTokenDoc = await AuthTokenModel.findOne({ userId: user._id });

      if (authTokenDoc) {
        // update existing doc with new refresh token
        await this.model.updateOne(
          { userId: user._id },
          { $set: { token: refreshToken } }
        );
      } else {
        await this.model.create({
          userId: user._id,
          token: refreshToken,
        });
      }

      res.status(200).json({
        message: 'Login successful',
        data: {
          accessToken,
          refreshToken,
        },
      });
    } catch (error) {
      this.errorHandler(error as Error, req, res);
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
        throw new Error(this.ERROR_MESSAGES.UNAUTHORIZED);
      }

      const tokenDoc = await AuthTokenModel.findOne({ token: refreshToken });

      if (!tokenDoc) {
        throw new Error(this.ERROR_MESSAGES.UNAUTHORIZED);
      }

      //CHECK REDIS
      //IF BLACKLISTED LOG OUT AND STUFF

      const userId = tokenDoc.userId.toString();

      const newAccessToken = signAccessToken(userId);
      const newRefreshToken = signRefreshToken(userId);

      await AuthTokenModel.updateOne(
        { userId: userId },
        { $set: { token: newRefreshToken } }
      );

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
      this.errorHandler(error as Error, req, res);
    }
  }

  async verifyEmail(req: Request, res: Response) {
    const UserModel = this.registry.get('userModel');
    try {
      const { token } = VerifyEmailSchema.parse(req.params);

      const decoded = this.jwtUtil.verifyAccessToken(token);

      const userId = decoded.userId;

      const user = await UserModel.findById(userId);

      if (!user) throw new Error(this.ERROR_MESSAGES.NOT_FOUND);

      await UserModel.findByIdAndUpdate(userId, {
        $set: { isVerified: true },
      });

      res.redirect(`${config.clientUrl}/login?verified=true`);
    } catch (error) {
      this.errorHandler(error as Error, req, res);
    }
  }

  async forgotPassword(req: Request, res: Response) {
    const UserModel = this.registry.get('userModel');
    try {
      const { email } = ForgotPasswordSchema.parse(req.body);

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

          //possibly send over token as well?
          this.broker.emit('forgot:password', {
            userId: user._id.toString(),
            email: user.email,
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
      this.errorHandler(error as Error, req, res);
    }
  }

  async resetPassword(req: Request, res: Response) {
    const UserModel = this.registry.get('userModel');
    try {
      const { token, newPassword } = ResetPasswordSchema.parse(req.body);

      //hash token and look it up
      const hashedToken = hashToken(token);
      const tokenDoc = await VerificationTokenModel.findOne({
        token: hashedToken,
        type: 'password_reset',
      });

      if (!tokenDoc) {
        throw new Error(this.ERROR_MESSAGES.INVALID_TOKEN);
      }

      //update password
      const user = await UserModel.findById(tokenDoc.userId);

      if (!user) {
        throw new Error(this.ERROR_MESSAGES.INVALID_TOKEN);
      }

      user.password = newPassword;
      await user.save();

      //delete token
      await VerificationTokenModel.deleteOne({ _id: tokenDoc._id });

      //revoke all sessions and force login
      await AuthTokenModel.deleteMany({ userId: tokenDoc.userId });

      res.status(200).json({ message: 'Password successfully reset' });
    } catch (error) {
      this.errorHandler(error as Error, req, res);
    }
  }
}

export default new AuthController();
