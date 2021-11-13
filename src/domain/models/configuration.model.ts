import {model, property, Entity} from '@loopback/repository';
import * as ejs from 'ejs';
import {SignupRequest} from './request.model';

export namespace SystemStatus {
  export const INITIALIZED = 'INITIALIZED';
}

export type SystemStatusData = {
  status: string;
};

export type MailSmtpSettings = {
  password: string;
  smtpHost: string;
  username: string;
  smtpPort: string;
  senderEmail: string;
  senderName: string;
};

interface EmailSettingData {
  emailTemplate: string;
  subject: string;
  senderEmail: string;
  senderName: string;
}
abstract class EmailSettings<CP> {
  emailTemplate: string;
  subject: string;
  senderEmail: string;
  senderName: string;

  constructor(options: EmailSettingData) {
    this.emailTemplate = options.emailTemplate;
    this.subject = options.subject;
    this.senderEmail = options.senderEmail;
    this.senderName = options.senderName;
  }

  abstract composeEmailContent(values: CP): string;

  abstract validateEmailTemplate(): boolean;
}

interface VerifyAccountEmailVariables {
  verificationLink: string;
}
export class VerifyAccountSettings extends EmailSettings<VerifyAccountEmailVariables> {
  private static VerificationLinkVariable = 'ACCOUNT_VERIFICATION_LINK';

  constructor(options: EmailSettingData) {
    super(options);
  }

  public composeEmailContent(values: VerifyAccountEmailVariables): string {
    return ejs.render(this.emailTemplate, {
      [VerifyAccountSettings.VerificationLinkVariable]: values.verificationLink,
    });
  }

  public validateEmailTemplate(): boolean {
    const verificationLinkPlaceholder = `<%=${VerifyAccountSettings.VerificationLinkVariable}%>`;
    return this.emailTemplate.includes(verificationLinkPlaceholder);
  }
}

interface NewAccountEmailVariables {
  username: string;
  email: string;
  password: string;
  verificationLink: string;
}
export class NewAccountSettings extends EmailSettings<NewAccountEmailVariables> {
  private static VerificationLinkVariable = 'ACCOUNT_VERIFICATION_LINK';
  private static UsernameVariable = 'ACCOUNT_USERNAME';
  private static EmailVariable = 'ACCOUNT_EMAIL';
  private static PasswordVariable = 'ACCOUNT_PASSWORD';

  constructor(options: EmailSettingData) {
    super(options);
  }

  public composeEmailContent(values: NewAccountEmailVariables): string {
    const {email, password, verificationLink, username} = values;
    return ejs.render(this.emailTemplate, {
      [NewAccountSettings.VerificationLinkVariable]: verificationLink,
      [NewAccountSettings.UsernameVariable]: username,
      [NewAccountSettings.EmailVariable]: email,
      [NewAccountSettings.PasswordVariable]: password,
    });
  }

  public validateEmailTemplate(): boolean {
    const verificationLinkPlaceholder = `<%=${NewAccountSettings.VerificationLinkVariable}%>`;
    return this.emailTemplate.includes(verificationLinkPlaceholder);
  }
}

interface RejectionVariables {}
export class RejectionSettings extends EmailSettings<RejectionVariables> {
  constructor(options: EmailSettingData) {
    super(options);
  }

  public composeEmailContent(): string {
    return ejs.render(this.emailTemplate);
  }

  public validateEmailTemplate(): boolean {
    return true;
  }
}

interface SignUpRequestVariables {
  data: SignupRequest;
  signUpRequestLink: string;
}
export class SignUpRequestSettings extends EmailSettings<SignUpRequestVariables> {
  private static SignUpRequestLinkVariable = 'SIGN_UP_REQUEST_LINK';
  private static SignUpRequestEmail = 'SIGN_UP_REQUEST_EMAIL';
  private static SignUpRequestUsername = 'SIGN_UP_REQUEST_USERNAME';
  private static SignUpRequestFirstName = 'SIGN_UP_REQUEST_FIRSTNAME';
  private static SignUpRequestLastName = 'SIGN_UP_REQUEST_LASTNAME';
  private static SignUpRequestDescription = 'SIGN_UP_REQUEST_DESCRIPTION';

  constructor(options: EmailSettingData) {
    super(options);
  }

  public composeEmailContent(values: SignUpRequestVariables): string {
    const {
      data: {email, username, firstName, lastName, description},
      signUpRequestLink,
    } = values;
    return ejs.render(this.emailTemplate, {
      [SignUpRequestSettings.SignUpRequestLinkVariable]: signUpRequestLink,
      [SignUpRequestSettings.SignUpRequestUsername]: username,
      [SignUpRequestSettings.SignUpRequestEmail]: email,
      [SignUpRequestSettings.SignUpRequestFirstName]: firstName,
      [SignUpRequestSettings.SignUpRequestLastName]: lastName,
      [SignUpRequestSettings.SignUpRequestDescription]: description,
    });
  }

  public validateEmailTemplate(): boolean {
    const verificationLinkPlaceholder = `<%=${SignUpRequestSettings.SignUpRequestLinkVariable}%>`;
    return this.emailTemplate.includes(verificationLinkPlaceholder);
  }
}

interface ResetPasswordEmailVariable {
  resetPasswordLink: string;
}
export class ResetPasswordSettings extends EmailSettings<ResetPasswordEmailVariable> {
  private static ResetPasswordLinkVariable = 'RESET_PASSWORD_LINK';

  public composeEmailContent(values: ResetPasswordEmailVariable): string {
    return ejs.render(this.emailTemplate, {
      RESET_PASSWORD_LINK: values.resetPasswordLink,
    });
  }

  public validateEmailTemplate(): boolean {
    const verificationLinkPlaceholder = `<%=${ResetPasswordSettings.ResetPasswordLinkVariable}%>`;
    return this.emailTemplate.includes(verificationLinkPlaceholder);
  }
}

export type ConfigurationData =
  | SystemStatusData
  | MailSmtpSettings
  | ResetPasswordSettings
  | VerifyAccountSettings
  | SignUpRequestSettings
  | RejectionSettings;

export enum ConfigurationKey {
  SYSTEM_STATUS = 'SYSTEM_STATUS',
  MAIL_SMTP_SETTINGS = 'MAIL_SMTP_SETTINGS',
  RESET_PASSWORD_SETTINGS = 'RESET_PASSWORD_SETTINGS',
  VERIFY_ACCOUNT_SETTINGS = 'VERIFY_ACCOUNT_SETTINGS',
  NEW_ACCOUNT_SETTINGS = 'NEW_ACCOUNT_SETTINGS',
  SIGN_UP_REQUEST_SETTINGS = 'SIGN_UP_REQUEST_SETTINGS',
  REJECTION_SETTINGS = 'REJECTION_SETTINGS',
}

@model({settings: {idInjection: false}})
export class Configuration extends Entity {
  @property({
    type: 'string',
    id: true,
    required: true,
    jsonSchema: {
      enum: [
        ConfigurationKey.SYSTEM_STATUS,
        ConfigurationKey.MAIL_SMTP_SETTINGS,
        ConfigurationKey.RESET_PASSWORD_SETTINGS,
        ConfigurationKey.VERIFY_ACCOUNT_SETTINGS,
        ConfigurationKey.NEW_ACCOUNT_SETTINGS,
        ConfigurationKey.SIGN_UP_REQUEST_SETTINGS,
        ConfigurationKey.REJECTION_SETTINGS,
      ],
    },
  })
  id: ConfigurationKey;

  @property({
    type: 'object',
    postgresql: {
      dataType: 'json',
    },
  })
  data: ConfigurationData;

  @property({
    type: 'date',
    postgresql: {
      columnName: 'createdAt',
    },
  })
  createdAt: Date;

  @property({
    type: 'date',
    postgresql: {
      columnName: 'updatedAt',
    },
  })
  updatedAt: Date;

  constructor(data?: Partial<Configuration>) {
    super(data);
  }
}
