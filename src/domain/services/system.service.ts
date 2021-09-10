import {repository} from '@loopback/repository';
import {bind, config} from '@loopback/context';
import {ConfigurationRepository} from '../../infrastructure/repositories';
import {
  Configuration,
  ConfigurationKey,
  SystemStatus,
  SystemStatusData,
} from '../models/configuration.model';
import {ConfigBindings} from '../../keys';
import {
  assertArgumentEqual,
  assertStateFalse,
} from '../helpers/assertion-concern.helper';

@bind()
export class SystemService {
  constructor(
    @repository(ConfigurationRepository)
    private configurationRepository: ConfigurationRepository,

    @config({
      fromBinding: ConfigBindings.APP_CONFIG,
      propertyPath: 'systemInitializationPassword',
    })
    private systemInitializationPassword: string,
  ) {}

  public async initialize(password: string): Promise<Configuration> {
    await this.assertSystemNotInitialized();

    assertArgumentEqual(
      password,
      this.systemInitializationPassword,
      'invalid_password',
    );

    return new Configuration({
      id: ConfigurationKey.SYSTEM_STATUS,
      data: {
        status: SystemStatus.INITIALIZED,
      },
    });
  }

  public async isInitialized(): Promise<boolean> {
    const systemStatusConfig = await this.getSystemStatusConfig();

    if (!systemStatusConfig || !systemStatusConfig.data) {
      return false;
    }

    const systemStatus = (systemStatusConfig.data as SystemStatusData).status;
    return systemStatus === SystemStatus.INITIALIZED;
  }

  public async isValidSystemInitializationPassword(
    password: string,
  ): Promise<boolean> {
    await this.assertSystemNotInitialized();

    return password === this.systemInitializationPassword;
  }

  private async getSystemStatusConfig(): Promise<Configuration | null> {
    return this.configurationRepository.findOne({
      where: {id: ConfigurationKey.SYSTEM_STATUS},
    });
  }

  private async assertSystemNotInitialized(): Promise<void> {
    assertStateFalse(await this.isInitialized(), 'system_already_initialized');
  }
}
