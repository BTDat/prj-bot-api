import {bind, inject} from '@loopback/context';
import {Account} from '../models/account.model';
import {PasswordHasher} from './password-hasher.service';
import {IllegalArgumentError} from '../errors/illegal-argument.error';
import {repository} from '@loopback/repository';
import {AccountRepository} from '../../infrastructure/repositories';
import {AccountSendMailFactory} from '../../application/services/account-send-mail-factory.service';
import {service} from '@loopback/core';
import {NodeMailerMailService} from '../../infrastructure/services/nodemailer.service';
import {AccountFactory} from './account-factory.service';

@bind()
export class AccountService {
  constructor(
    @repository(AccountRepository)
    private accountRepository: AccountRepository,

    @service(AccountFactory)
    private accountFactory: AccountFactory,

    @service(AccountSendMailFactory)
    private accountSendMailFactory: AccountSendMailFactory,

    @service(NodeMailerMailService)
    private mailService: NodeMailerMailService,

    @inject('services.BcryptPasswordHasher')
    private passwordHasher: PasswordHasher,
  ) {}

  public async setNewPassword(
    account: Account,
    newPassword: string,
  ): Promise<void> {
    const hashedPassword = await this.passwordHasher.hashPassword(newPassword);
    account.setNewPassword(hashedPassword);
  }

  public async changePassword(
    account: Account,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const currentPasswordIsCorrect = await this.passwordHasher.comparePassword(
      currentPassword,
      account.password,
    );

    if (!currentPasswordIsCorrect) {
      throw new IllegalArgumentError('invalid_current_password');
    }

    await this.setNewPassword(account, newPassword);
  }

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
