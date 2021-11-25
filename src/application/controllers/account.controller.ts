import {inject, service} from '@loopback/core';
import {
  Count,
  CountSchema,
  Filter,
  repository,
  Where,
} from '@loopback/repository';
import {
  del,
  get,
  getFilterSchemaFor,
  getModelSchemaRef,
  getWhereSchemaFor,
  HttpErrors,
  param,
  patch,
  post,
  put,
  requestBody,
} from '@loopback/rest';
import {authenticate} from '@loopback/authentication';
import {AUTHENTICATED, authorize, EVERYONE} from '@loopback/authorization';
import {SecurityBindings, securityId, UserProfile} from '@loopback/security';
import {
  Account,
  AccountConstraint,
  Role,
} from '../../domain/models/account.model';
import {
  AccountRepository,
  ConfigurationRepository,
} from '../../infrastructure/repositories';
import {AccountTokenService} from '../services/account-token.service';
import {AccountService} from '../../domain/services/account.service';
import {getModelSchemaRefExtended} from '../utils/openapi-schema';
import {NodeMailerMailService} from '../../infrastructure/services/nodemailer.service';
import {
  Credentials,
  LocalAuthenticationService,
} from '../services/local-authentication.service';
import {AccountFactory} from '../../domain/services/account-factory.service';
import {AccountSendMailFactory} from '../services/account-send-mail-factory.service';

export class AccountController {
  constructor(
    @repository(AccountRepository)
    private accountRepository: AccountRepository,

    @repository(ConfigurationRepository)
    private configurationRepository: ConfigurationRepository,

    @service(AccountTokenService)
    private accountTokenService: AccountTokenService,

    @service(NodeMailerMailService)
    private mailService: NodeMailerMailService,

    @service(AccountService)
    private accountService: AccountService,

    @service(AccountSendMailFactory)
    private accountSendMailFactory: AccountSendMailFactory,

    @service(AccountFactory)
    private accountFactory: AccountFactory,

    @service(LocalAuthenticationService)
    private authenticationService: LocalAuthenticationService,

    @inject(SecurityBindings.USER, {optional: true})
    private currentAuthUserProfile: UserProfile, // @config({ //   fromBinding: ConfigBindings.APP_CONFIG, //   propertyPath: 'frontEndBaseUrl', // }) // private frontEndBaseUrl: string,
  ) {}

  @post('/accounts', {
    responses: {
      '200': {
        description: 'User model instance',
        content: {
          'application/json': {schema: getModelSchemaRef(Account)},
        },
      },
    },
  })
  @authenticate('jwt')
  @authorize({allowedRoles: [AUTHENTICATED, Role.ROOT_ADMIN]})
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Account, {
            exclude: [
              'id',
              'createdAt',
              'updatedAt',
              'role',
              'status',
              'emailVerified',
            ],
            title: 'Account.Create',
          }),
        },
      },
    })
    values: {
      profitRate: number;
      username: string;
      password: string;
      email: string;
      firstName: string;
      lastName: string;
    },
  ): Promise<Account> {
    return this.accountService.createAccount(values);
  }

  @get('/accounts/me', {
    responses: {
      '200': {
        description: 'User model instance',
        content: {
          'application/json': {schema: getModelSchemaRef(Account)},
        },
      },
    },
  })
  @authenticate('jwt')
  @authorize({allowedRoles: [AUTHENTICATED]})
  async findMe(): Promise<Account> {
    const accountId = parseInt(this.currentAuthUserProfile[securityId]);
    return this.accountRepository.findById(accountId);
  }

  @get('/accounts/count', {
    responses: {
      '200': {
        description: 'User model count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  @authenticate('jwt')
  @authorize({allowedRoles: [AUTHENTICATED]})
  async count(
    @param.query.object('where', getWhereSchemaFor(Account))
    where?: Where<Account>,
  ): Promise<Count> {
    return this.accountRepository.count(where);
  }

  @get('/accounts', {
    responses: {
      '200': {
        description: 'Array of User model instances',
        content: {
          'application/json': {
            schema: {type: 'array', items: getModelSchemaRef(Account)},
          },
        },
      },
    },
  })
  @authenticate('jwt')
  @authorize({allowedRoles: [AUTHENTICATED, Role.ROOT_ADMIN]})
  async find(
    @param.query.object('filter', getFilterSchemaFor(Account))
    filter?: Filter<Account>,
  ): Promise<Account[]> {
    return this.accountRepository.find(filter);
  }

  @get('/accounts/{id}', {
    responses: {
      '200': {
        description: 'User model instance',
        content: {
          'application/json': {schema: getModelSchemaRef(Account)},
        },
      },
    },
  })
  @authenticate('jwt')
  @authorize({allowedRoles: [AUTHENTICATED]})
  async findById(
    @param.path.string('id') id: string | number,
  ): Promise<Account> {
    const accountId = (
      id === 'me' ? this.currentAuthUserProfile[securityId] : id
    ) as number;
    return this.accountRepository.findById(accountId);
  }

  @patch('/accounts/{id}', {
    responses: {
      '204': {
        description: 'User PATCH success',
      },
    },
  })
  @authenticate('jwt')
  @authorize({allowedRoles: [AUTHENTICATED, Role.ROOT_ADMIN]})
  async updateById(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Account, {
            partial: true,
            exclude: ['createdAt', 'updatedAt'],
            title: 'Account.Update',
          }),
        },
      },
    })
    user: Account,
  ): Promise<void> {
    await this.accountRepository.updateById(id, user);
  }

  @put('/accounts/{id}', {
    responses: {
      '204': {
        description: 'User PUT success',
      },
    },
  })
  @authenticate('jwt')
  @authorize({allowedRoles: [AUTHENTICATED, Role.ROOT_ADMIN]})
  async replaceById(
    @param.path.string('id') id: number,
    @requestBody() user: Account,
  ): Promise<void> {
    await this.accountRepository.replaceById(id, user);
  }

  @del('/accounts/{id}', {
    responses: {
      '204': {
        description: 'User DELETE success',
      },
    },
  })
  @authenticate('jwt')
  @authorize({allowedRoles: [Role.ROOT_ADMIN]})
  async deleteById(@param.path.number('id') id: number): Promise<void> {
    await this.accountRepository.deleteById(id);
  }

  @post('/accounts/login', {
    responses: {
      '200': {
        description: 'Token',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                token: {
                  type: 'string',
                },
              },
            },
          },
        },
      },
    },
  })
  async login(
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              emailOrUsername: {type: 'string'},
              password: {type: 'string'},
            },
          },
        },
      },
    })
    credentials: Credentials,
  ): Promise<{token: string}> {
    const account = await this.authenticationService.verifyCredentials(
      credentials,
    );
    const userProfile =
      this.authenticationService.convertToUserProfile(account);
    const token = await this.accountTokenService.generateToken(userProfile);
    return {token};
  }

  // @post('/accounts/signup', {
  //   responses: {
  //     '200': {
  //       description: 'Token',
  //       content: {
  //         'application/json': {
  //           schema: {
  //             type: 'object',
  //             properties: {
  //               token: {
  //                 type: 'string',
  //               },
  //             },
  //           },
  //         },
  //       },
  //     },
  //   },
  // })
  // async signup(
  //   @requestBody({
  //     content: {
  //       'application/json': {
  //         schema: getModelSchemaRefExtended(Account, {
  //           include: ['email', 'password', 'firstName', 'lastName'],
  //           title: 'Account.SignUp',
  //         }),
  //       },
  //     },
  //   })
  //   values: Pick<Account, 'email' | 'password' | 'firstName' | 'lastName'>,
  // ): Promise<Account> {
  //   let account = await this.accountFactory.buildUserAccount(values);
  //   account = await this.accountRepository.create(account);

  //   // No need to wait for email sending.
  //   this.sendAccountVerificationEmail(account);

  //   return account;
  // }

  @post('/accounts/send-reset-password-email', {
    responses: {
      '204': {
        description:
          'The response should be empty. In the client should reload the page when the request is done.',
      },
      '404': {
        description: "User's email not found",
      },
      '400': {
        description:
          'System cannot generate reset password token or cannot send reset password email',
      },
    },
  })
  async sendResetPasswordEmail(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRefExtended(Account, {
            include: ['email'],
            title: 'Account.RequestResetPassword',
          }),
        },
      },
    })
    body: {
      email: string;
    },
  ): Promise<void> {
    const account = await this.accountRepository.findByEmail(body.email);

    if (!account) {
      throw new HttpErrors.NotFound('user_not_found');
    }

    const email = await this.accountSendMailFactory.buildResetPasswordEmail(
      account,
    );
    await this.mailService.send(email);
  }

  @post('/accounts/{id}/reset-password', {
    responses: {
      '204': {
        description:
          'The response should be empty. Reset password successfully.',
      },
      '404': {
        description: 'User not found',
      },
    },
  })
  async resetPassword(
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['accountId', 'newPassword', 'resetPasswordToken'],
            properties: {
              accountId: {
                type: 'number',
              },
              newPassword: {
                type: 'string',
                minLength: AccountConstraint.PASSWORD_MIN_LENGTH,
                maxLength: AccountConstraint.PASSWORD_MAX_LENGTH,
              },
              resetPasswordToken: {
                type: 'string',
              },
            },
          },
        },
      },
    })
    body: {
      accountId: number;
      newPassword: string;
      resetPasswordToken: string;
    },
  ): Promise<void> {
    const account = await this.accountTokenService.verifyResetPasswordToken(
      body.accountId,
      body.resetPasswordToken,
    );
    await this.accountService.setNewPassword(account, body.newPassword);
    await this.accountRepository.save(account);
  }

  @post('/accounts/me/change-password', {
    responses: {
      '204': {
        description:
          'The response should be empty. Change password successfully.',
      },
      '404': {
        description: 'User not found',
      },
      '400': {
        description: 'Cannot perform update password at Db Layer',
      },
    },
  })
  @authenticate('jwt')
  @authorize({allowedRoles: [AUTHENTICATED, Role.ROOT_ADMIN]})
  async changePassword(
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['currentPassword', 'newPassword'],
            properties: {
              currentPassword: {
                type: 'string',
                minLength: AccountConstraint.PASSWORD_MIN_LENGTH,
                maxLength: AccountConstraint.PASSWORD_MAX_LENGTH,
              },
              newPassword: {
                type: 'string',
                minLength: AccountConstraint.PASSWORD_MIN_LENGTH,
                maxLength: AccountConstraint.PASSWORD_MAX_LENGTH,
              },
            },
          },
        },
      },
    })
    body: {
      newPassword: string;
      currentPassword: string;
    },
  ): Promise<void> {
    const account = await this.accountRepository.findById(
      parseInt(this.currentAuthUserProfile[securityId]),
    );

    await this.accountService.changePassword(
      account,
      body.currentPassword,
      body.newPassword,
    );

    await this.accountRepository.save(account);
  }

  @post('/accounts/verify', {
    responses: {
      '204': {
        description: 'The response should be empty. Verify successfully.',
      },
      '404': {
        description: 'User not found',
      },
      '400': {
        description: 'JWT invalid',
      },
    },
  })
  @authenticate('jwt')
  @authorize({allowedRoles: [EVERYONE]})
  async verifyAccount(
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['token'],
            properties: {
              token: {
                type: 'string',
              },
            },
          },
        },
      },
    })
    body: {
      token: string;
    },
  ): Promise<void> {
    const account =
      await this.accountTokenService.verifyAccountVerificationToken(body.token);

    account.verify();
    await this.accountRepository.save(account);
  }

  @post('/accounts/me/resend-verification-email', {
    responses: {
      '204': {description: 'Resend verification email'},
    },
  })
  @authenticate('jwt')
  @authorize({allowedRoles: [AUTHENTICATED]})
  async resendVerificationEmail(): Promise<void> {
    const accountId = parseInt(this.currentAuthUserProfile[securityId]);
    const account = await this.accountRepository.findById(accountId);
    if (!account) {
      throw new HttpErrors.BadRequest('account_not_exist');
    }
    await this.sendAccountVerificationEmail(account);
  }

  private async sendAccountVerificationEmail(account: Account): Promise<void> {
    const email =
      await this.accountSendMailFactory.buildAccountVerificationEmail(account);
    await this.mailService.send(email);
  }
}
