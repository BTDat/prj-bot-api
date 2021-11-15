import {DefaultCrudRepository, juggler} from '@loopback/repository';
import {inject} from '@loopback/core';
import {Constructor} from '@loopback/context';
import {
  Configuration,
  ConfigurationKey,
  InvoiceSettings,
  NewAccountSettings,
  RejectionSettings,
  ResetPasswordSettings,
  SignUpRequestSettings,
  VerifyAccountSettings,
} from '../../domain/models/configuration.model';
import {TimestampRepositoryMixin} from './mixins/timestamp-mixin.repository';
import {DataSourceBindings} from '../../keys';

export class ConfigurationRepository extends TimestampRepositoryMixin<
  Configuration,
  typeof Configuration.prototype.id,
  Constructor<
    DefaultCrudRepository<Configuration, typeof Configuration.prototype.id>
  >
>(DefaultCrudRepository) {
  constructor(
    @inject(DataSourceBindings.DATASOURCE_DB)
    dataSource: juggler.DataSource,
  ) {
    super(Configuration, dataSource);
  }

  public async getInvoiceEmailSettings(): Promise<InvoiceSettings | undefined> {
    const config = await this.findById(ConfigurationKey.INVOICE_SETTINGS);
    return config?.data
      ? new InvoiceSettings(config.data as InvoiceSettings)
      : undefined;
  }

  public async getRejectionEmailSettings(): Promise<
    RejectionSettings | undefined
  > {
    const config = await this.findById(ConfigurationKey.REJECTION_SETTINGS);
    return config?.data
      ? new RejectionSettings(config.data as RejectionSettings)
      : undefined;
  }

  public async getSignUpRequestEmailSettings(): Promise<
    SignUpRequestSettings | undefined
  > {
    const config = await this.findById(
      ConfigurationKey.SIGN_UP_REQUEST_SETTINGS,
    );
    return config?.data
      ? new SignUpRequestSettings(config.data as SignUpRequestSettings)
      : undefined;
  }

  public async getNewAccountCreationEmailSettings(): Promise<
    NewAccountSettings | undefined
  > {
    const config = await this.findById(ConfigurationKey.NEW_ACCOUNT_SETTINGS);
    return config?.data
      ? new NewAccountSettings(config.data as NewAccountSettings)
      : undefined;
  }

  public async getAccountVerificationEmailSettings(): Promise<
    VerifyAccountSettings | undefined
  > {
    const config = await this.findById(
      ConfigurationKey.VERIFY_ACCOUNT_SETTINGS,
    );
    return config?.data
      ? new VerifyAccountSettings(config.data as VerifyAccountSettings)
      : undefined;
  }

  public async getResetPasswordEmailSettings(): Promise<
    ResetPasswordSettings | undefined
  > {
    const config = await this.findOne({
      where: {id: ConfigurationKey.RESET_PASSWORD_SETTINGS},
    });
    return config?.data
      ? new ResetPasswordSettings(config.data as ResetPasswordSettings)
      : undefined;
  }
}
