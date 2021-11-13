import {bind} from '@loopback/context';
import {service} from '@loopback/core';
import {repository} from '@loopback/repository';
import {Account} from '../../domain/models/account.model';
import {AccountRepository} from '../../infrastructure/repositories';

import {NodeMailerMailService} from '../../infrastructure/services/nodemailer.service';
import {AccountFactory} from '../../domain/services/account-factory.service';
import {AccountSendMailFactory} from './account-send-mail-factory.service';

@bind()
export class AccountCreationService {
  constructor(
    @repository(AccountRepository)
    private accountRepository: AccountRepository,

    @service(AccountFactory)
    private accountFactory: AccountFactory,

    @service(AccountSendMailFactory)
    private accountSendMailFactory: AccountSendMailFactory,

    @service(NodeMailerMailService)
    private mailService: NodeMailerMailService,
  ) {}

  public async createAccount(values: {
    profitRate: number;
    username: string;
    password: string;
    email: string;
    firstName: string;
    lastName: string;
  }): Promise<Account> {
    const newAccount = await this.accountFactory.buildAccount({
      ...values,
    });
    const {account} = newAccount;
    const result = await this.accountRepository.create(account);

    this.sendNewAccountCreationEmail(account, values.password);
    return result;
  }

  private async sendNewAccountCreationEmail(
    account: Account,
    password: string,
  ): Promise<void> {
    const email =
      await this.accountSendMailFactory.buildNewAccountCreationEmail(
        account,
        password,
      );
    await this.mailService.send(email);
  }
}
