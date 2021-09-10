import {repository} from '@loopback/repository';
import {bind, inject} from '@loopback/context';
import {Account, AccountStatus, Role} from '../models/account.model';
import {AccountRepository} from '../repositories/account.repository';
import {PasswordHasher} from './password-hasher.service';
import {IllegalArgumentError} from '../errors/illegal-argument.error';

@bind()
export class AccountFactory {
  constructor(
    @repository('AccountRepository')
    private accountRepository: AccountRepository,

    @inject('services.BcryptPasswordHasher')
    private passwordHasher: PasswordHasher,
  ) {}

  public async buildUserAccount(
    values: Pick<Account, 'email' | 'password' | 'firstName' | 'lastName'>,
  ): Promise<Account> {
    return this.buildAccount(
      new Account({
        ...values,
        role: Role.USER,
        status: AccountStatus.ACTIVE,
        emailVerified: false,
      }),
    );
  }

  public async buildAdminAccount(
    values: Pick<Account, 'email' | 'password' | 'firstName' | 'lastName'>,
  ): Promise<Account> {
    return this.buildAccount(
      new Account({
        ...values,
        role: Role.ROOT_ADMIN,
        status: AccountStatus.ACTIVE,
        emailVerified: true,
      }),
    );
  }

  public async buildAccount(
    values: Pick<
      Account,
      'email' | 'password' | 'firstName' | 'lastName' | 'role'
    >,
  ): Promise<Account> {
    const emailExisted = await this.accountRepository.emailRegistered(
      values.email,
    );

    if (emailExisted) {
      throw new IllegalArgumentError('email_registered');
    }

    const hashedPassword = await this.passwordHasher.hashPassword(
      values.password,
    );
    return new Account({
      ...values,
      password: hashedPassword,
      status: AccountStatus.ACTIVE,
    });
  }
}
