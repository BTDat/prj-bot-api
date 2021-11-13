import {DefaultCrudRepository, juggler} from '@loopback/repository';
import {inject} from '@loopback/core';
import {Constructor} from '@loopback/context';
import {RequestRepository as IRequestRepository} from '../../domain/repositories/request.repository';
import {TimestampRepositoryMixin} from './mixins/timestamp-mixin.repository';
import {DataSourceBindings} from '../../keys';
import {Request} from '../../domain/models/request.model';

export class RequestRepository
  extends TimestampRepositoryMixin<
    Request,
    typeof Request.prototype.id,
    Constructor<DefaultCrudRepository<Request, typeof Request.prototype.id>>
  >(DefaultCrudRepository)
  implements IRequestRepository
{
  constructor(
    @inject(DataSourceBindings.DATASOURCE_DB)
    dataSource: juggler.DataSource,
  ) {
    super(Request, dataSource);
  }
}
