import {Request, HttpErrors} from '@loopback/rest';
import {AuthenticationStrategy} from '@loopback/authentication';
import {UserProfile} from '@loopback/security';
import * as cookie from 'cookie';
import {service} from '@loopback/core';
import {AccountTokenService} from '../services/account-token.service';

export class JWTAuthenticationStrategy implements AuthenticationStrategy {
  name = 'jwt';

  constructor(
    @service(AccountTokenService)
    public tokenService: AccountTokenService,
  ) {}

  public async authenticate(
    request: Request,
  ): Promise<UserProfile | undefined> {
    const token = this.extractJwtToken(request);

    if (!token) {
      throw new HttpErrors.Unauthorized();
    }

    return this.tokenService.verifyToken(token);
  }

  private extractJwtToken(request: Request): string | null {
    return (
      this.extractJwtFromHeader(request) ?? this.extractJwtFromCookie(request)
    );
  }

  private extractJwtFromHeader(request: Request): string | null {
    // For example : Bearer xxx.yyy.zzz
    const authHeaderValue = request.headers.authorization;

    if (!authHeaderValue || !authHeaderValue.startsWith('Bearer')) {
      return null;
    }

    // Split the string into 2 parts : 'Bearer ' and the `xxx.yyy.zzz`
    const parts = authHeaderValue.split(' ');
    if (parts.length !== 2) {
      return null;
    }

    return parts[1];
  }

  private extractJwtFromCookie(request: Request): string | null {
    if (!request.headers.cookie) {
      return null;
    }

    const cookies = cookie.parse(request.headers.cookie as string);
    return cookies.jwt;
  }
}
