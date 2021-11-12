import {bind} from '@loopback/context';
import {ProfitRate, ProfitRateStatus} from '../models/profit-rate.model';

@bind()
export class ProfitRateFactory {
  constructor() {}

  public async buildProfitRate(
    values: Pick<ProfitRate, 'rate'>,
  ): Promise<ProfitRate> {
    return new ProfitRate({
      ...values,
      status: ProfitRateStatus.ACTIVE,
    });
  }
}
