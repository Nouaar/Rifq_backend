// src/mail/mail.service.ts
import { Injectable, InternalServerErrorException } from '@nestjs/common';
// eslint-disable-next-line @typescript-eslint/no-require-imports
import sgMail = require('@sendgrid/mail');

@Injectable()
export class MailService {
  constructor() {
    const apiKey = process.env.SENDGRID_API_KEY;
    if (!apiKey) {
      throw new Error('SENDGRID_API_KEY is not defined');
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    sgMail.setApiKey(apiKey);
  }

  async sendVerificationCode(email: string, code: string): Promise<void> {
    const from = process.env.MAIL_FROM;
    if (!from) {
      throw new Error('MAIL_FROM is not defined');
    }

    const msg = {
      to: email,
      from: from,
      subject: 'Verify your email address',
      html: `
        <h2>Your verification code</h2>
        <p>Use this code to verify your email:</p>
        <h1 style="font-size: 32px; letter-spacing: 4px;">${code}</h1>
        <p>This code will expire in 10 minutes.</p>
      `,
    };

    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      await sgMail.send(msg);
      console.log(`Verification email sent to ${email}`);
    } catch (err) {
      console.error('Failed to send verification email:', err);
      throw new InternalServerErrorException(
        'Could not send verification email. Please try again later.',
      );
    }
  }
}
