import {DefaultCrudRepository, juggler} from '@loopback/repository';
import {inject} from '@loopback/core';
import {Constructor} from '@loopback/context';
import {
  Configuration,
  ConfigurationKey,
  ResetPasswordSettings,
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
