import {bind, config} from '@loopback/context';
import {TokenService} from '@loopback/authentication';
import {HttpErrors} from '@loopback/rest';
import {repository} from '@loopback/repository';
import {securityId, UserProfile} from '@loopback/security';
import {sign, verify} from 'jsonwebtoken';
import {ConfigBindings} from '../../keys';
import {Account} from '../../domain/models/account.model';
import {AccountRepository} from '../../infrastructure/repositories';

export type AccessTokenPayload = {
  id: number;
  name: string;
  email: string;
};

export type ResetPasswordTokenPayload = {
  accountId: number;
};

export type AccountVerificationTokenPayload = {
  accountId: number;
};

@bind()
export class AccountTokenService implements TokenService {
  constructor(
    @config({
      fromBinding: ConfigBindings.APP_CONFIG,
      propertyPath: 'jwtSecret',
    })
    private jwtSecret: string,

    @repository(AccountRepository)
    private accountRepository: AccountRepository,

    private resetPasswordTokenValidDuration = 900, // 15min
  ) {}

  public generateAccountVerificationToken(account: Account): string {
    if (!account.canVerifyEmail()) {
      throw new Error('invalid_account');
    }

    const payload: AccountVerificationTokenPayload = {accountId: account.id};
    return sign(payload, this.jwtSecret);
  }

  public async verifyAccountVerificationToken(token: string): Promise<Account> {
    let decodedToken: AccountVerificationTokenPayload;
    try {
      decodedToken = verify(
        token,
        this.jwtSecret,
      ) as AccountVerificationTokenPayload;
    } catch (e) {
      throw new HttpErrors.Forbidden('invalid_token');
    }

    if (!decodedToken.accountId) {
      throw new HttpErrors.Forbidden('invalid_token');
    }

    return this.accountRepository.findById(decodedToken.accountId);
  }

  public generateResetPasswordToken(account: Account): string {
    const payload: ResetPasswordTokenPayload = {accountId: account.id};
    return sign(payload, account.password, {
      expiresIn: this.resetPasswordTokenValidDuration,
    });
  }

  public async verifyResetPasswordToken(
    accountId: number,
    token: string,
  ): Promise<Account> {
    const account = await this.accountRepository.findById(accountId);

    let decodedToken: ResetPasswordTokenPayload;
    try {
      decodedToken = verify(
        token,
        account.password,
      ) as ResetPasswordTokenPayload;
    } catch (e) {
      throw new HttpErrors.Forbidden('invalid_token');
    }

    if (decodedToken.accountId !== accountId) {
      throw new HttpErrors.Forbidden('invalid_token');
    }

    return account;
  }

  public async generateToken(userProfile: UserProfile): Promise<string> {
    const payload: AccessTokenPayload = {
      id: parseInt(userProfile[securityId]),
      name: '',
      email: userProfile.email ?? '',
    };
    return sign(payload, this.jwtSecret);
  }

  public async verifyToken(token: string): Promise<UserProfile> {
    let userProfile: UserProfile = {[securityId]: '', name: '', email: ''};

    let account: Account;
    try {
      const decodedPayload = verify(
        token,
        this.jwtSecret,
      ) as AccessTokenPayload;
      account = await this.accountRepository.findById(decodedPayload.id);

      if (!account.isActive()) {
        throw new HttpErrors.Unauthorized('inactive_account');
      }

      userProfile = Object.assign(userProfile, {
        [securityId]: account.id,
        name: '',
        email: account.email,
      });
    } catch (error) {
      throw new HttpErrors.Unauthorized('invalid_token');
    }

    return userProfile;
  }
}
