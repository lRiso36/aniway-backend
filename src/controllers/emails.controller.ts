import BaseController from './base.controller';
import Email, { IEmail } from '../models/email.model';

import transporter from '../utils/mailer.util';

class EmailsController extends BaseController<IEmail> {
  transporter: typeof transporter;

  constructor() {
    super(Email);
    this.transporter = transporter;
  }

  async send(to: string, subject: string, text: string, html?: string) {
    try {
      const mailOptions = {
        from: this.config.emailUser,
        to,
        subject,
        text,
        html,
      };

      const tranport = await this.transporter.sendMail(mailOptions);
      console.log(tranport);

      const email = new Email({
        to,
        subject,
        text,
        html,
        // messageId: tranport.messageId
      });

      await email.save();
    } catch (error) {
      this.logger.error('Error in send', error);
    }
  }

  // FINISH THIS

  listeners() {
    this.broker.on('user:registered', async (user) => {
      this.logger.info('user:registerd event received', user);
      const accessToken = this.jwtUtil.signAccessToken(user.userId);

      const link = `http://localhost:5000/api/v1/auth/verify-email/${accessToken}`;

      const UserModel = this.registry.get('userModel');
      const foundUser = await UserModel.findById(user.userId);
      this.send(
        foundUser.email,
        'Verify your email',
        'Click the link below to verify your email:',
        `<a href="${link}">Click to verify</a>`
      );
    });

    this.broker.on('forgot:password', async (user, email) => {
      this.logger.info('forgot:password event received', user, email);
      this.send(
        user.email,
        'Reset your password',
        'Click the link below to reset your password:',
        '<a href="TODO_RESET_LINK">TODO_RESET_LINK</a>'
      );
    });
  }
}

const emailsController = new EmailsController();

export default emailsController;
