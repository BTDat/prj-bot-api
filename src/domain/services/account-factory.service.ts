import {repository} from '@loopback/repository';
import {bind, inject} from '@loopback/context';
import {
  Account,
  AccountStatus,
  RawAccount,
  Role,
} from '../models/account.model';
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
    values: Pick<
      Account,
      'email' | 'password' | 'firstName' | 'lastName' | 'profitRate'
    >,
  ): Promise<RawAccount> {
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
    values: Pick<Account, 'email' | 'password' | 'username'>,
  ): Promise<Account> {
    const isValid = this.accountRepository.isUserNameValid(values.username);
    if (!isValid) {
      throw new IllegalArgumentError('invalid_username');
    }
    const emailExisted = await this.accountRepository.emailRegistered(
      values.email,
    );

    if (emailExisted) {
      throw new IllegalArgumentError('email_registered');
    }

    const usernameExisted = await this.accountRepository.usernameRegistered(
      values.username,
    );

    if (usernameExisted) {
      throw new IllegalArgumentError('username_registered');
    }

    const hashedPassword = await this.passwordHasher.hashPassword(
      values.password,
    );
    return new Account({
      ...values,
      role: Role.ROOT_ADMIN,
      status: AccountStatus.ACTIVE,
      emailVerified: true,
      password: hashedPassword,
    });
  }

  public async buildAccount(
    values: Pick<
      Account,
      | 'email'
      | 'username'
      | 'firstName'
      | 'lastName'
      | 'profitRate'
      | 'password'
    >,
  ): Promise<RawAccount> {
    const isValid = this.accountRepository.isUserNameValid(values.username);
    if (!isValid) {
      throw new IllegalArgumentError('invalid_username');
    }
    const emailExisted = await this.accountRepository.emailRegistered(
      values.email,
    );

    const usernameExisted = await this.accountRepository.usernameRegistered(
      values.username,
    );

    if (emailExisted) {
      throw new IllegalArgumentError('email_registered');
    }

    if (usernameExisted) {
      throw new IllegalArgumentError('username_registered');
    }

    const hashedPassword = await this.passwordHasher.hashPassword(
      values.password,
    );

    const newAccount = new Account({
      ...values,
      password: hashedPassword,
      status: AccountStatus.ACTIVE,
      role: Role.USER,
    });
    return {
      password: values.password,
      account: newAccount,
    };
  }
}
