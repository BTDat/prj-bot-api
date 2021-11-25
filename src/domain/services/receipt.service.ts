import {bind} from '@loopback/context';
import {repository} from '@loopback/repository';
import {
  AccountRepository,
  ReceiptRepository,
} from '../../infrastructure/repositories';
import {AccountSendMailFactory} from '../../application/services/account-send-mail-factory.service';
import {service} from '@loopback/core';
import {NodeMailerMailService} from '../../infrastructure/services/nodemailer.service';
import {Receipt} from '../models/receipt.model';
import {ReceiptFactory} from './receipt-factory.service';
import {HttpErrors} from '@loopback/rest';
import {BotStatus} from '../models/bot.model';

@bind()
export class ReceiptService {
  constructor(
    @repository(AccountRepository)
    private accountRepository: AccountRepository,

    @repository(ReceiptRepository)
    private receiptRepository: ReceiptRepository,

    @service(ReceiptFactory)
    private receiptFactory: ReceiptFactory,

    @service(NodeMailerMailService)
    private mailService: NodeMailerMailService,

    @service(AccountSendMailFactory)
    private accountSendMailFactory: AccountSendMailFactory,
  ) {}

  private async sendInvoiceEmail(
    recipient: string,
    receipt: Receipt,
  ): Promise<void> {
    const email = await this.accountSendMailFactory.buildInvoiceEmail(
      recipient,
      receipt,
    );
    await this.mailService.send(email);
  }

  public async createReceipt(
    recipient: string,
    receipt: Omit<Receipt, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<void> {
    const receiptBuilding = await this.receiptFactory.buildReceipt(receipt);
    const newReceipt = await this.receiptRepository.create(receiptBuilding);
    if (!newReceipt) {
      throw new HttpErrors.BadGateway('receipt_creation_failed');
    }
    const {accountId} = newReceipt;
    await this.accountRepository.updateById(accountId, {
      botStatus: BotStatus.DEACTIVATE,
    });
    this.sendInvoiceEmail(recipient, newReceipt);
  }
}
