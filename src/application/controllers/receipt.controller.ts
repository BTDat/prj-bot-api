import {authenticate} from '@loopback/authentication';
import {AUTHENTICATED, authorize} from '@loopback/authorization';
import {inject, service} from '@loopback/core';
import {
  Count,
  CountSchema,
  Filter,
  repository,
  Where,
} from '@loopback/repository';
import {
  api,
  get,
  getFilterSchemaFor,
  getModelSchemaRef,
  getWhereSchemaFor,
  HttpErrors,
  param,
  post,
  requestBody,
} from '@loopback/rest';
import {SecurityBindings, securityId, UserProfile} from '@loopback/security';
import {Role} from '../../domain/models/account.model';
import {Receipt} from '../../domain/models/receipt.model';
import {ReceiptFactory} from '../../domain/services/receipt-factory.service';
import {ReceiptRepository} from '../../infrastructure/repositories/receipt.repository';

@api({
  basePath: '/receipts',
})
export class ReceiptController {
  constructor(
    @repository(ReceiptRepository)
    private receiptRepository: ReceiptRepository,

    @service(ReceiptFactory)
    private receiptFactory: ReceiptFactory,

    @inject(SecurityBindings.USER, {optional: true})
    private currentAuthUserProfile: UserProfile,
  ) {}

  @post('', {
    responses: {
      '200': {
        description: 'New receipts',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: {
                schemas: getModelSchemaRef(Receipt),
              },
            },
          },
        },
      },
    },
  })
  @authenticate('jwt')
  @authorize({allowedRoles: [AUTHENTICATED]})
  async createReceipt(
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              rate: {type: 'number'},
            },
          },
        },
      },
    })
    values: Omit<Receipt, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<Receipt> {
    const newReceipt = await this.receiptFactory.buildReceipt(values);
    const result = await this.receiptRepository.create(newReceipt);
    return result;
  }

  @get('', {
    responses: {
      '200': {
        description: 'Array of profit rates',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: getModelSchemaRef(Receipt),
            },
          },
        },
      },
    },
  })
  @authenticate('jwt')
  @authorize({allowedRoles: [AUTHENTICATED]})
  async findReceipts(
    @param.query.object('filter', getFilterSchemaFor(Receipt))
    filter?: Filter<Receipt>,
  ): Promise<Receipt[]> {
    return this.receiptRepository.find(filter);
  }

  @get('/{id}', {
    responses: {
      '200': {
        description: 'Object of receipt',
        content: {
          'application/json': {
            schema: getModelSchemaRef(Receipt),
          },
        },
      },
    },
  })
  @authenticate('jwt')
  @authorize({allowedRoles: [AUTHENTICATED]})
  async findReceiptById(@param.path.number('id') id: number): Promise<Receipt> {
    const receipt = await this.receiptRepository.findById(id);
    if (!receipt) {
      throw new HttpErrors.BadRequest('profit_rates_does_not_exist');
    }
    return receipt;
  }

  @get('/me', {
    responses: {
      '200': {
        description: 'Array of Receipts',
        content: {
          'application/json': {schema: getModelSchemaRef(Receipt)},
        },
      },
    },
  })
  @authenticate('jwt')
  @authorize({allowedRoles: [AUTHENTICATED, Role.USER]})
  async findReceiptsForMe(
    @param.query.object('filter', getFilterSchemaFor(Receipt))
    filter?: Filter<Receipt>,
  ): Promise<Receipt[]> {
    const accountId = parseInt(this.currentAuthUserProfile[securityId]);
    return this.receiptRepository.find(filter, {
      where: {
        accountId,
      },
    });
  }

  @get('/me/count', {
    responses: {
      '200': {
        description: 'Count Receipts',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  @authenticate('jwt')
  @authorize({allowedRoles: [AUTHENTICATED]})
  async countReceipts(
    @param.query.object('where', getWhereSchemaFor(Receipt))
    where?: Where<Receipt>,
  ): Promise<Count> {
    return this.receiptRepository.count(where);
  }
}
