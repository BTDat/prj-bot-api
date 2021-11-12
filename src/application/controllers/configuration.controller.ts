import {repository} from '@loopback/repository';
import {service} from '@loopback/core';
import {
  get,
  getModelSchemaRef,
  param,
  post,
  put,
  requestBody,
} from '@loopback/rest';
import {authenticate} from '@loopback/authentication';
import {authorize} from '@loopback/authorization';
import {
  Configuration,
  ConfigurationKey,
  MailSmtpSettings,
} from '../../domain/models/configuration.model';
import {
  AccountRepository,
  ConfigurationRepository,
} from '../../infrastructure/repositories';
import {Role} from '../../domain/models/account.model';
import {NodeMailerMailService} from '../../infrastructure/services/nodemailer.service';
import {FixtureLoader} from '../../infrastructure/services/fixture-loader.service';
import {SystemService} from '../../domain/services/system.service';
import {AccountFactory} from '../../domain/services/account-factory.service';

export class ConfigurationController {
  constructor(
    @repository(ConfigurationRepository)
    private configurationRepository: ConfigurationRepository,

    @repository(AccountRepository)
    private accountRepository: AccountRepository,

    @service(AccountFactory)
    private accountFactory: AccountFactory,

    @service(SystemService)
    private systemService: SystemService,

    @service(NodeMailerMailService)
    private mailService: NodeMailerMailService,

    @service(FixtureLoader)
    private fixtureLoader: FixtureLoader,
  ) {}

  @get('/configurations/{id}', {
    responses: {
      '200': {
        description: 'Configuration model instance',
        content: {
          'application/json': {schema: getModelSchemaRef(Configuration)},
        },
      },
    },
  })
  @authenticate('jwt')
  @authorize({allowedRoles: [Role.ROOT_ADMIN]})
  async findById(
    @param.path.string('id') id: ConfigurationKey,
  ): Promise<Configuration> {
    return this.configurationRepository.findById(id);
  }

  @put('/configurations/{id}', {
    responses: {
      '204': {
        description: 'Configuration PUT success',
      },
    },
  })
  @authenticate('jwt')
  @authorize({allowedRoles: [Role.ROOT_ADMIN]})
  async replaceById(
    @param.path.string('id') id: ConfigurationKey,
    @requestBody() configuration: Configuration,
  ): Promise<void> {
    // This is special for system configuration.
    // If the admin modify a configuration that does not exist yet, save it as
    // a new one, rather than throwing not found error.
    const configExisted = await this.configurationRepository.exists(id);
    if (configExisted) {
      await this.configurationRepository.replaceById(id, configuration);
    } else {
      await this.configurationRepository.create(configuration);
    }
  }

  @post('/configurations/validate-mail-smtp-settings', {
    responses: {
      '200': {
        description: 'Validate system initialization password',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {isValid: {type: 'boolean'}},
            },
          },
        },
      },
    },
  })
  @authenticate('jwt')
  @authorize({allowedRoles: [Role.ROOT_ADMIN]})
  async validateMailSmtpSettings(
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              password: {type: 'string'},
              smtpHost: {type: 'string'},
              senderEmail: {type: 'string'},
              username: {type: 'string'},
              smtpPort: {type: 'string'},
            },
          },
        },
      },
    })
    body: MailSmtpSettings,
  ): Promise<{isValid: boolean}> {
    return {
      isValid: await this.mailService.isValidMailSmtpSetting(body),
    };
  }

  @post('/configurations/validate-system-initialization-password', {
    responses: {
      '200': {
        description: 'Validate system initialization password',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {isValid: {type: 'boolean'}},
            },
          },
        },
      },
    },
  })
  async validateSystemInitializationPassword(
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['password'],
            properties: {password: {type: 'string'}},
          },
        },
      },
    })
    body: {
      password: string;
    },
  ): Promise<{isValid: boolean}> {
    const isValid =
      await this.systemService.isValidSystemInitializationPassword(
        body.password,
      );
    return {isValid};
  }

  @post('/configurations/initialize-system', {
    responses: {
      '200': {
        description: 'Validate system initialization password',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {isValid: {type: 'boolean'}},
            },
          },
        },
      },
      '401': {
        description: 'System password is invalid',
      },
      '403': {
        description: 'System has been initialized already',
      },
      '409': {
        description: 'User email already existed',
      },
    },
  })
  async initializeSystem(
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              password: {type: 'string'},
              admin: {
                type: 'object',
                properties: {
                  email: {type: 'string'},
                  username: {type: 'string'},
                  password: {type: 'string'},
                },
              },
            },
          },
        },
      },
    })
    body: {
      password: string;
      admin: {
        email: string;
        username: string;
        password: string;
        firstName: string;
        lastName: string;
      };
    },
  ): Promise<{success: boolean}> {
    const adminAccount = await this.accountFactory.buildAdminAccount(
      body.admin,
    );
    await this.accountRepository.create(adminAccount);

    const fixtureConfigurations = this.fixtureLoader.getConfigurations();
    await this.configurationRepository.createAll(fixtureConfigurations);

    const initializedSystemConfig = await this.systemService.initialize(
      body.password,
    );
    await this.configurationRepository.create(initializedSystemConfig);

    return {success: true};
  }

  /**
   * Admin can use this API to trigger system to be reinitialized.
   * E.g:
   *  - Refetch latest data from 3rd party sides and store to DB.
   *  - Seed additional system configurations.
   */
  @post('/configurations/reinitialize-system', {
    responses: {
      '200': {
        description: 'Validate system initialization password',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {success: {type: 'boolean'}},
            },
          },
        },
      },
    },
  })
  @authenticate('jwt')
  @authorize({allowedRoles: [Role.ROOT_ADMIN]})
  async reinitializeSystem(): Promise<{success: boolean}> {
    // Save missing configuration fixture.
    const existingConfigurations = await this.configurationRepository.find();
    const existingConfigurationIds = existingConfigurations.map(
      config => config.id,
    );
    const fixtureConfigurations = this.fixtureLoader.getConfigurations();
    const missingConfigurations = fixtureConfigurations.filter(
      config => !existingConfigurationIds.includes(config.id),
    );
    await this.configurationRepository.createAll(missingConfigurations);

    return {success: true};
  }

  @post('/configurations/check-system-initialization-status', {
    responses: {
      '200': {
        description: 'Check if system has been initialized',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {isInitialized: {type: 'boolean'}},
            },
          },
        },
      },
    },
  })
  async checkSystemInitializationStatus(): Promise<{isInitialized: boolean}> {
    const isInitialized = await this.systemService.isInitialized();
    return {isInitialized};
  }
}
