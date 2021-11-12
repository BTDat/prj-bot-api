import {bind, config} from '@loopback/context';
import {service} from '@loopback/core';
import {HttpErrors} from '@loopback/rest';
import {repository} from '@loopback/repository';
import {Account, Role} from '../../domain/models/account.model';
import {ConfigurationRepository} from '../../infrastructure/repositories';
import {AccountTokenService} from './account-token.service';
import {ConfigBindings} from '../../keys';
import {Email} from '../../infrastructure/services/nodemailer.service';

@bind()
export class AccountSendMailFactory {
  constructor(
    @repository(ConfigurationRepository)
    private configurationRepository: ConfigurationRepository,

    @service(AccountTokenService)
    private accountTokenService: AccountTokenService,

    @config({
      fromBinding: ConfigBindings.APP_CONFIG,
      propertyPath: 'frontEndBaseUrl',
    })
    private frontEndBaseUrl: string,
  ) {}

  public async buildAccountVerificationEmail(account: Account): Promise<Email> {
    if (!account.canVerifyEmail()) {
      throw new HttpErrors.Forbidden('invalid_account');
    }

    const emailSettings =
      await this.configurationRepository.getAccountVerificationEmailSettings();

    if (!emailSettings) {
      throw new Error('email_settings_not_found');
    }

    const token =
      this.accountTokenService.generateAccountVerificationToken(account);
    const link = `${this.frontEndBaseUrl}/verify-account?token=${token}`;

    const emailContent = emailSettings.composeEmailContent({
      verificationLink: link,
    });

    return {
      subject: emailSettings.subject,
      senderEmail: emailSettings.senderEmail,
      senderName: emailSettings.senderName,
      content: emailContent,
      recipient: account.email,
    };
  }

  public async buildResetPasswordEmail(account: Account): Promise<Email> {
    if (!account.isActive()) {
      throw new HttpErrors.Forbidden('inactive_account');
    }

    const emailSettings =
      await this.configurationRepository.getResetPasswordEmailSettings();

    if (!emailSettings) {
      throw new Error('email_settings_not_found');
    }

    const token = this.accountTokenService.generateResetPasswordToken(account);
    const link =
      account.role === Role.ROOT_ADMIN
        ? `${this.frontEndBaseUrl}/admin/reset-new-password?accountId=${account.id}&token=${token}`
        : `${this.frontEndBaseUrl}/reset-new-password?accountId=${account.id}&token=${token}`;
    const emailContent = emailSettings.composeEmailContent({
      resetPasswordLink: link,
    });

    return {
      subject: emailSettings.subject,
      senderEmail: emailSettings.senderEmail,
      senderName: emailSettings.senderName,
      content: emailContent,
      recipient: account.email,
    };
  }
}
