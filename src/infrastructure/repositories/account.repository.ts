import {DefaultCrudRepository, juggler} from '@loopback/repository';
import {inject} from '@loopback/core';
import {Constructor} from '@loopback/context';
import {AccountRepository as IAccountRepository} from '../../domain/repositories/account.repository';
import {Account} from '../../domain/models/account.model';
import {TimestampRepositoryMixin} from './mixins/timestamp-mixin.repository';
import {DataSourceBindings} from '../../keys';

export class AccountRepository
  extends TimestampRepositoryMixin<
    Account,
    typeof Account.prototype.id,
    Constructor<DefaultCrudRepository<Account, typeof Account.prototype.id>>
  >(DefaultCrudRepository)
  implements IAccountRepository {
  constructor(
    @inject(DataSourceBindings.DATASOURCE_DB)
    dataSource: juggler.DataSource,
  ) {
    super(Account, dataSource);
  }

  public async emailRegistered(email: string): Promise<boolean> {
    const existingAccount = await this.findByEmail(email);
    return !!existingAccount;
  }

  public async findByEmail(email: string): Promise<Account | null> {
    return this.findOne({where: {email}});
  }
}
