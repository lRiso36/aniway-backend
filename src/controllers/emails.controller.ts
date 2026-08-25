import BaseController from "./base.controller";
import Email, { IEmail } from "../models/email.model";

import transporter from '../utils/mailer.util'

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
      html
    }

    const tranport = await this.transporter.sendMail(mailOptions);
    console.log(tranport);
    
    const email = new Email({
      to,
      subject,
      text,
      html,
      // messageId: tranport.messageId
    })

    await email.save();
  } catch (error) {
    this.logger.error('Error in send', error);
  }

  }

  // FINISH THIS

  listeners() {
    this.broker.on("user:registered", async (user) => {
      this.logger.info("user:registerd event received", user);
      
      const UserModel = this.registry.get("userModel");
      const foundUser = await UserModel.findById(user.userId);
      this.send(
        foundUser.email,
        'Verify your email',
        'Click the link below to verify your email:',
        '<a href="TODO_VERIFICATION_LINK">TODO_VERIFICATION_LINK</a>',
      )
    })
  }
}

const emailsController = new EmailsController();

export default emailsController;