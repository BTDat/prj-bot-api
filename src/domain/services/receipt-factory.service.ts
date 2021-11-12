import {bind} from '@loopback/context';
import {Receipt} from '../models/receipt.model';

@bind()
export class ReceiptFactory {
  constructor() {}

  public async buildReceipt(
    values: Pick<Receipt, 'accountId' | 'balance' | 'profit' | 'profitRateId'>,
  ): Promise<Receipt> {
    return new Receipt({
      ...values,
    });
  }
}
