import {bind, config} from '@loopback/context';
import {service} from '@loopback/core';
import {HttpErrors} from '@loopback/rest';
import {repository} from '@loopback/repository';
import {Account, Role} from '../../domain/models/account.model';
import {ConfigurationRepository} from '../../infrastructure/repositories';
import {AccountTokenService} from './account-token.service';
import {ConfigBindings} from '../../keys';
import {Email} from '../../infrastructure/services/nodemailer.service';
import {SignupRequest} from '../../domain/models/request.model';
import {Receipt} from '../../domain/models/receipt.model';

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

    @config({
      fromBinding: ConfigBindings.APP_CONFIG,
      propertyPath: 'adminEmail',
    })
    private adminEmail: string,
  ) {}

  public async buildNewAccountCreationEmail(
    account: Account,
    password: string,
  ): Promise<Email> {
    if (!account.canVerifyEmail()) {
      throw new HttpErrors.Forbidden('invalid_account');
    }

    const {email, username} = account;

    const emailSettings =
      await this.configurationRepository.getNewAccountCreationEmailSettings();

    if (!emailSettings) {
      throw new Error('email_settings_not_found');
    }

    const token =
      this.accountTokenService.generateAccountVerificationToken(account);
    const link = `${this.frontEndBaseUrl}/verify-account?token=${token}`;

    const emailContent = emailSettings.composeEmailContent({
      verificationLink: link,
      email,
      username,
      password,
    });

    return {
      subject: emailSettings.subject,
      senderEmail: emailSettings.senderEmail,
      senderName: emailSettings.senderName,
      content: emailContent,
      recipient: account.email,
    };
  }

  public async buildSignUpRequestEmail(
    requestId: number,
    data: SignupRequest,
  ): Promise<Email> {
    const emailSettings =
      await this.configurationRepository.getSignUpRequestEmailSettings();

    if (!emailSettings) {
      throw new Error('email_settings_not_found');
    }

    const link = `${this.frontEndBaseUrl}/request/${requestId}`;

    const emailContent = emailSettings.composeEmailContent({
      data,
      signUpRequestLink: link,
    });

    return {
      subject: emailSettings.subject,
      senderEmail: emailSettings.senderEmail,
      senderName: emailSettings.senderName,
      content: emailContent,
      recipient: this.adminEmail,
    };
  }

  public async buildRejectionEmail(recipient: string): Promise<Email> {
    const emailSettings =
      await this.configurationRepository.getRejectionEmailSettings();

    if (!emailSettings) {
      throw new Error('email_settings_not_found');
    }

    const emailContent = emailSettings.composeEmailContent();

    return {
      subject: emailSettings.subject,
      senderEmail: emailSettings.senderEmail,
      senderName: emailSettings.senderName,
      content: emailContent,
      recipient,
    };
  }

  public async buildInvoiceEmail(
    recipient: string,
    receipt: Receipt,
  ): Promise<Email> {
    const emailSettings =
      await this.configurationRepository.getInvoiceEmailSettings();

    if (!emailSettings) {
      throw new Error('email_settings_not_found');
    }

    const emailContent = emailSettings.composeEmailContent({receipt});

    return {
      subject: emailSettings.subject,
      senderEmail: emailSettings.senderEmail,
      senderName: emailSettings.senderName,
      content: emailContent,
      recipient,
    };
  }

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
