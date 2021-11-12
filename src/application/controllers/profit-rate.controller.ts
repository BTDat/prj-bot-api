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
import {Role} from '../../domain/models/account.model';
import {ProfitRate} from '../../domain/models/profit-rate.model';
import {ProfitRateFactory} from '../../domain/services/profit-rate-factory.service';
import {ProfitRateRepository} from '../../infrastructure/repositories';

@api({
  basePath: '/profit-rates',
})
export class ProfitController {
  constructor(
    @repository(ProfitRateRepository)
    private profitRateRepository: ProfitRateRepository,

    @service(ProfitRateFactory)
    private profitRateFactory: ProfitRateFactory,
  ) {}

  @post('', {
    responses: {
      '200': {
        description: 'Array of profit rate',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: {
                schemas: getModelSchemaRef(ProfitRate),
              },
            },
          },
        },
      },
    },
  })
  @authenticate('jwt')
  @authorize({allowedRoles: [Role.ROOT_ADMIN]})
  async createProfitRate(
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
    values: Pick<ProfitRate, 'rate'>,
  ): Promise<ProfitRate> {
    const newProfitRate = await this.profitRateFactory.buildProfitRate(values);
    const result = await this.profitRateRepository.create(newProfitRate);
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
              items: getModelSchemaRef(ProfitRate),
            },
          },
        },
      },
    },
  })
  @authenticate('jwt')
  @authorize({allowedRoles: [AUTHENTICATED]})
  async findProfitRates(
    @param.query.object('filter', getFilterSchemaFor(ProfitRate))
    filter?: Filter<ProfitRate>,
  ): Promise<ProfitRate[]> {
    const schemas = await this.profitRateRepository.find(filter);
    return schemas;
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
  async findProfitRateById(
    @param.path.number('id') id: number,
  ): Promise<ProfitRate> {
    const profitRates = await this.profitRateRepository.findById(id);
    if (!profitRates) {
      throw new HttpErrors.BadRequest('profit_rates_does_not_exist');
    }
    return profitRates;
  }

  @patch('/{id}', {
    responses: {
      '204': {
        description: 'Profit rate PATCH success',
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
          schema: getModelSchemaRef(ProfitRate, {
            partial: true,
            exclude: ['createdAt', 'updatedAt'],
            title: 'ProfitRate.Update',
          }),
        },
      },
    })
    values: ProfitRate,
  ): Promise<void> {
    await this.profitRateRepository.updateById(id, values);
  }
}
