import {authenticate} from '@loopback/authentication';
import {AUTHENTICATED, authorize} from '@loopback/authorization';
import {service} from '@loopback/core';
import {Filter, repository} from '@loopback/repository';
import {
  api,
  get,
  getFilterSchemaFor,
  getModelSchemaRef,
  HttpErrors,
  param,
  patch,
  post,
  requestBody,
} from '@loopback/rest';
import {Account, Role} from '../../domain/models/account.model';
import {
  Request,
  RequestStatus,
  RequestType,
  SignupRequest,
} from '../../domain/models/request.model';
import {RequestFactory} from '../../domain/services/request-factory.service';
import {RequestRepository} from '../../infrastructure/repositories/request.repository';
import {NodeMailerMailService} from '../../infrastructure/services/nodemailer.service';
import {AccountCreationService} from '../services/account-creation.service';
import {AccountSendMailFactory} from '../services/account-send-mail-factory.service';

@api({
  basePath: '/request',
})
export class RequestController {
  constructor(
    @repository(RequestRepository)
    private requestRepository: RequestRepository,

    @service(RequestFactory)
    private requestFactory: RequestFactory,

    @service(NodeMailerMailService)
    private mailService: NodeMailerMailService,

    @service(AccountCreationService)
    private accountCreationService: AccountCreationService,

    @service(AccountSendMailFactory)
    private accountSendMailFactory: AccountSendMailFactory,
  ) {}

  @post('/register', {
    responses: {
      '200': {
        description: 'New Request',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: {
                schemas: getModelSchemaRef(Request),
              },
            },
          },
        },
      },
    },
  })
  async createRequest(
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              type: {type: 'string'},
              data: {type: 'object'},
            },
          },
        },
      },
    })
    values: Omit<Request, 'id' | 'createdAt' | 'updatedAt' | 'status'>,
  ): Promise<Request> {
    const newRequest = await this.requestFactory.buildRequest(values);
    const result = await this.requestRepository.create(newRequest);
    const {type, data} = result;
    switch (type) {
      case RequestType.SIGN_UP: {
        this.sendSignupRequestEmail(result.id, data);
        break;
      }
      default: {
        break;
      }
    }
    return result;
  }

  @get('', {
    responses: {
      '200': {
        description: 'Array of request',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: getModelSchemaRef(Request),
            },
          },
        },
      },
    },
  })
  @authenticate('jwt')
  @authorize({allowedRoles: [AUTHENTICATED, Role.ROOT_ADMIN]})
  async findRequests(
    @param.query.object('filter', getFilterSchemaFor(Request))
    filter?: Filter<Request>,
  ): Promise<Request[]> {
    return this.requestRepository.find(filter);
  }

  @get('/{id}', {
    responses: {
      '200': {
        description: 'Object of request',
        content: {
          'application/json': {
            schema: getModelSchemaRef(Request),
          },
        },
      },
    },
  })
  @authenticate('jwt')
  @authorize({allowedRoles: [AUTHENTICATED]})
  async findRequestById(@param.path.number('id') id: number): Promise<Request> {
    const request = await this.requestRepository.findById(id);
    if (!request) {
      throw new HttpErrors.BadRequest('request_does_not_exist');
    }
    return request;
  }

  @patch('/{id}/reject', {
    responses: {
      '200': {
        description: 'Object of request',
        content: {
          'application/json': {
            schema: getModelSchemaRef(Request),
          },
        },
      },
    },
  })
  @authenticate('jwt')
  @authorize({allowedRoles: [AUTHENTICATED, Role.ROOT_ADMIN]})
  async rejectRequest(@param.path.number('id') id: number): Promise<void> {
    const request = await this.requestRepository.findById(id);
    if (!request) {
      throw new HttpErrors.BadRequest('request_does_not_exist');
    }
    await this.requestRepository.updateById(id, {
      status: RequestStatus.DENIED,
      updatedAt: new Date()
    });
    this.sendRejectionEmail(request.data.email)
  }

  @post('/{id}/accept', {
    responses: {
      '200': {
        description: 'Object of request',
        content: {
          'application/json': {
            schema: getModelSchemaRef(Request),
          },
        },
      },
    },
  })
  @authenticate('jwt')
  @authorize({allowedRoles: [AUTHENTICATED, Role.ROOT_ADMIN]})
  async acceptRequest(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              profitRate: {type: 'number'},
              password: {type: 'string'}
            },
          },
        },
      },
    })
    values: {
      profitRate: number;
      password: string;
    },
  ): Promise<Account> {
    const request = await this.requestRepository.findById(id);
    if (!request) {
      throw new HttpErrors.BadRequest('request_does_not_exist');
    }
    const {
      data: {email, username, firstName, lastName},
    } = request;
    const {profitRate, password} = values
    const result = await this.accountCreationService.createAccount({
      email, username, firstName, lastName, profitRate, password
    })
    
    await this.requestRepository.updateById(id, {
      status: RequestStatus.SUCCESS,
      updatedAt: new Date()
    });
    return result;
  }

  private async sendSignupRequestEmail(
    requestId: number,
    data: SignupRequest,
  ): Promise<void> {
    const email = await this.accountSendMailFactory.buildSignUpRequestEmail(
      requestId,
      data,
    );
    await this.mailService.send(email);
  }

  private async sendRejectionEmail(recipient: string): Promise<void> {
    const email = await this.accountSendMailFactory.buildRejectionEmail(
      recipient,
    );
    await this.mailService.send(email);
  }
}
