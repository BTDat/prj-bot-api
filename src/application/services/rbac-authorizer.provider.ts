import {Provider} from '@loopback/core';
import {repository} from '@loopback/repository';
import {
  AuthorizationContext,
  AuthorizationDecision,
  AuthorizationMetadata,
  AuthorizationTags,
  Authorizer,
  EVERYONE,
  AUTHENTICATED,
  UNAUTHENTICATED,
} from '@loopback/authorization';
import * as _ from 'lodash';
import {Principal, securityId} from '@loopback/security';
import {bind} from '@loopback/context';
import {AccountRepository} from '../../infrastructure/repositories';
import {Account} from '../../domain/models/account.model';

@bind({tags: AuthorizationTags.AUTHORIZER})
export class RbacAuthorizationProvider implements Provider<Authorizer> {
  constructor(
    @repository(AccountRepository)
    private accountRepository: AccountRepository,
  ) {}

  value(): Authorizer {
    return this.authorize.bind(this);
  }

  async authorize(
    authorizationCtx: AuthorizationContext,
    metadata: AuthorizationMetadata,
  ) {
    // This is to ensure the API is not publicly exposed by default when
    // when developers forget to set authorization for APIs.
    // If there is no roles allowed, then the access is denied by default!
    if (!metadata.allowedRoles) {
      return AuthorizationDecision.DENY;
    }

    if (metadata.allowedRoles.includes(EVERYONE)) {
      return AuthorizationDecision.ALLOW;
    }

    const principal: Principal = _.get(authorizationCtx, 'principals[0]');
    const userId = principal?.[securityId]
      ? parseInt(principal?.[securityId])
      : undefined;

    if (!userId) {
      if (metadata.allowedRoles.includes(UNAUTHENTICATED)) {
        return AuthorizationDecision.ALLOW;
      }

      return AuthorizationDecision.DENY;
    }

    const user: Account = await this.accountRepository.findById(userId);

    if (!user) {
      return AuthorizationDecision.DENY;
    }

    // Grant access when one of user's roles is allowed.
    if (
      metadata.allowedRoles.includes(user.role) ||
      metadata.allowedRoles.includes(AUTHENTICATED)
    ) {
      return AuthorizationDecision.ALLOW;
    }

    return AuthorizationDecision.DENY;
  }
}
