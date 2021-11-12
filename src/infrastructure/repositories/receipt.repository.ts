import {DefaultCrudRepository, juggler} from '@loopback/repository';
import {inject} from '@loopback/core';
import {Constructor} from '@loopback/context';
import {ReceiptRepository as IReceiptRepository} from '../../domain/repositories/receipt.repository';
import {TimestampRepositoryMixin} from './mixins/timestamp-mixin.repository';
import {DataSourceBindings} from '../../keys';
import {Receipt} from '../../domain/models/receipt.model';

export class ReceiptRepository
  extends TimestampRepositoryMixin<
    Receipt,
    typeof Receipt.prototype.id,
    Constructor<DefaultCrudRepository<Receipt, typeof Receipt.prototype.id>>
  >(DefaultCrudRepository)
  implements IReceiptRepository
{
  constructor(
    @inject(DataSourceBindings.DATASOURCE_DB)
    dataSource: juggler.DataSource,
  ) {
    super(Receipt, dataSource);
  }
}
