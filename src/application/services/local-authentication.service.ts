import {HttpErrors} from '@loopback/rest';
import {UserService as UserAuthenticationService} from '@loopback/authentication';
import {securityId, UserProfile} from '@loopback/security';
import {repository} from '@loopback/repository';
import {bind} from '@loopback/context';
import {service} from '@loopback/core';
import {AccountRepository} from '../../infrastructure/repositories';
import {Account} from '../../domain/models/account.model';
import {PasswordHasher} from '../../domain/services/password-hasher.service';
import {BcryptPasswordHasher} from '../../infrastructure/services/bcrypt-password-hasher.service';

export type Credentials = {
  emailOrUsername: string;
  password: string;
};

@bind()
export class LocalAuthenticationService
  implements UserAuthenticationService<Account, Credentials>
{
  constructor(
    @repository(AccountRepository)
    private accountRepository: AccountRepository,

    @service(BcryptPasswordHasher)
    private passwordHasher: PasswordHasher,
  ) {}

  async verifyCredentials(credentials: Credentials): Promise<Account> {
    let account = await this.accountRepository.findByUsername(
      credentials.emailOrUsername,
    );

    if (!account) {
      account = await this.accountRepository.findByEmail(
        credentials.emailOrUsername,
      );
    }

    if (!account || !account.isActive()) {
      throw new HttpErrors.Unauthorized('invalid_credentials');
    }

    const passwordMatched = await this.passwordHasher.comparePassword(
      credentials.password,
      account.password,
    );

    if (!passwordMatched) {
      throw new HttpErrors.Unauthorized('invalid_credentials');
    }

    return account;
  }

  convertToUserProfile(user: Account): UserProfile {
    return {[securityId]: user.id.toString(), name: ''};
  }
}
