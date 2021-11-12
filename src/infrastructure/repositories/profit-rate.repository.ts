import {DefaultCrudRepository, juggler} from '@loopback/repository';
import {inject} from '@loopback/core';
import {Constructor} from '@loopback/context';
import {ProfitRateRepository as IProfitRateRepository} from '../../domain/repositories/profit-rate.repository';
import {TimestampRepositoryMixin} from './mixins/timestamp-mixin.repository';
import {DataSourceBindings} from '../../keys';
import {ProfitRate} from '../../domain/models/profit-rate.model';

export class ProfitRateRepository
  extends TimestampRepositoryMixin<
    ProfitRate,
    typeof ProfitRate.prototype.id,
    Constructor<
      DefaultCrudRepository<ProfitRate, typeof ProfitRate.prototype.id>
    >
  >(DefaultCrudRepository)
  implements IProfitRateRepository
{
  constructor(
    @inject(DataSourceBindings.DATASOURCE_DB)
    dataSource: juggler.DataSource,
  ) {
    super(ProfitRate, dataSource);
  }
}
