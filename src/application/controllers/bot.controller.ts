import {authenticate} from '@loopback/authentication';
import {AUTHENTICATED, authorize} from '@loopback/authorization';
import {inject, service} from '@loopback/core';
import {repository} from '@loopback/repository';
import {api, post, requestBody} from '@loopback/rest';
import {SecurityBindings, securityId, UserProfile} from '@loopback/security';
import {BotRequestBody, BotStatus} from '../../domain/models/bot.model';
import {AccountRepository} from '../../infrastructure/repositories';
import {PuppeteerService} from '../../infrastructure/services/puppeteer.service';

@api({
  basePath: '/bots',
})
export class BotController {
  constructor(
    @inject(SecurityBindings.USER, {optional: true})
    private currentAuthUserProfile: UserProfile,

    @service(PuppeteerService)
    private puppeteerService: PuppeteerService,

    @repository(AccountRepository)
    private accountRepository: AccountRepository,
  ) {}

  @post('/activate', {
    responses: {
      '200': {
        description: 'Run bot',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                success: {type: 'boolean'},
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
              username: {type: 'string'},
              password: {type: 'string'},
              betLevel: {type: 'number'},
            },
          },
        },
      },
    })
    values: BotRequestBody,
  ): Promise<{success: boolean}> {
    try {
      const accountId = this.currentAuthUserProfile[securityId];
      const account = await this.accountRepository.findById(
        parseInt(accountId),
      );
      await this.accountRepository.updateById(account.id, {
        botStatus: BotStatus.ACTIVATE,
      });
      this.puppeteerService.run(values, account);
    } catch (error) {
      console.log({error});
      return {
        success: false,
      };
    }
    return {
      success: true,
    };
  }

  // @get('', {
  //   responses: {
  //     '200': {
  //       description: 'Array of profit rates',
  //       content: {
  //         'application/json': {
  //           schema: {
  //             type: 'array',
  //             items: getModelSchemaRef(Receipt),
  //           },
  //         },
  //       },
  //     },
  //   },
  // })
  // @authenticate('jwt')
  // @authorize({allowedRoles: [AUTHENTICATED]})
  // async findReceipts(
  //   @param.query.object('filter', getFilterSchemaFor(Receipt))
  //   filter?: Filter<Receipt>,
  // ): Promise<Receipt[]> {
  //   return this.receiptRepository.find(filter);
  // }

  // @get('/{id}', {
  //   responses: {
  //     '200': {
  //       description: 'Object of receipt',
  //       content: {
  //         'application/json': {
  //           schema: getModelSchemaRef(Receipt),
  //         },
  //       },
  //     },
  //   },
  // })
  // @authenticate('jwt')
  // @authorize({allowedRoles: [AUTHENTICATED]})
  // async findReceiptById(@param.path.number('id') id: number): Promise<Receipt> {
  //   const receipt = await this.receiptRepository.findById(id);
  //   if (!receipt) {
  //     throw new HttpErrors.BadRequest('profit_rates_does_not_exist');
  //   }
  //   return receipt;
  // }
}
