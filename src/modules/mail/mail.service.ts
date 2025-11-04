// src/mail/mail.service.ts
import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class MailService {
  constructor(private readonly mailerService: MailerService) {}

  async sendVerificationCode(email: string, code: string) {
    await this.mailerService.sendMail({
      to: email,
      subject: 'Verify your email address',
      html: `
      <h2>Your verification code</h2>
      <p>Use this code to verify your email:</p>
      <h1 style="font-size: 32px; letter-spacing: 4px;">${code}</h1>
      <p>This code will expire in 10 minutes.</p>
    `,
    });
  }
}
