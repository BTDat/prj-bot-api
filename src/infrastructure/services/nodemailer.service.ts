import {createTransport, Transporter} from 'nodemailer';
import {repository} from '@loopback/repository';
import {bind} from '@loopback/context';
import {
  ConfigurationKey,
  MailSmtpSettings,
} from '../../domain/models/configuration.model';
import {ConfigurationRepository} from '../repositories';

export interface Email {
  subject: string;
  senderEmail: string;
  senderName: string;
  content: string;
  recipient: string;
}

@bind()
export class NodeMailerMailService {
  constructor(
    @repository(ConfigurationRepository)
    private configurationRepository: ConfigurationRepository,
  ) {}

  async isValidMailSmtpSetting(
    mailSmtpSettings: MailSmtpSettings,
  ): Promise<boolean> {
    const nodeMailer: Transporter = createTransport({
      host: mailSmtpSettings.smtpHost,
      port: Number(mailSmtpSettings.smtpPort),
      auth: {
        user: mailSmtpSettings.username,
        pass: mailSmtpSettings.password,
      },
    });

    try {
      return await nodeMailer.verify();
    } catch (e) {
      return false;
    }
  }

  public async send(email: Email): Promise<void> {
    const smtpConfig = await this.configurationRepository.findOne({
      where: {id: ConfigurationKey.MAIL_SMTP_SETTINGS},
    });

    if (!smtpConfig) {
      throw new Error('smtp_settings_not_found');
    }

    const mailSmtpSettings: MailSmtpSettings =
      smtpConfig.data as MailSmtpSettings;

    const nodemailerTransporter = createTransport({
      host: mailSmtpSettings.smtpHost,
      port: Number(mailSmtpSettings.smtpPort),
      auth: {
        user: mailSmtpSettings.username,
        pass: mailSmtpSettings.password,
      },
    });

    await nodemailerTransporter.sendMail({
      html: email.content,
      to: email.recipient,
      subject: email.subject,
      from: email.senderEmail,
      sender: email.senderName,
    });
  }
}
