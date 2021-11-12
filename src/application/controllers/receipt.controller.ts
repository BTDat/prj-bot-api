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
  post,
  requestBody,
} from '@loopback/rest';
import {ProfitRate} from '../../domain/models/profit-rate.model';
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
  ) {}

  @post('', {
    responses: {
      '200': {
        description: 'Array of receipts',
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
    values: Omit<Receipt, 'id' | 'createdAt'>,
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
        description: 'Object of profit rate',
        content: {
          'application/json': {
            schema: getModelSchemaRef(ProfitRate),
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
}
