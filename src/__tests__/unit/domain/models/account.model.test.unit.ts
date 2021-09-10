import {expect} from '@loopback/testlab';
import {Account, AccountStatus} from '../../../../domain/models/account.model';
import {IllegalStateError} from '../../../../domain/errors/illegal-state.error';

describe('account.model', () => {
  describe('verify()', () => {
    it('should throw error if account status is inactive', async () => {
      const account = new Account();
      account.status = AccountStatus.INACTIVE;

      const expectedErr = new IllegalStateError('inactive_account');
      expect(() => {
        account.verify();
      }).to.throw(expectedErr);
    });

    it('should throw error if account is already verified', async () => {
      const account = new Account();
      account.status = AccountStatus.ACTIVE;
      account.emailVerified = true;

      const expectedErr = new IllegalStateError('already_verified');
      expect(() => {
        account.verify();
      }).to.throw(expectedErr);
    });

    it('should update emailVerified to be true if account state is valid', async () => {
      const account = new Account();
      account.status = AccountStatus.ACTIVE;
      account.emailVerified = false;

      account.verify();

      expect(account.emailVerified).equal(true);
    });
  });

  describe('setNewPassword()', () => {
    it('should throw error if account status is inactive', async () => {
      const account = new Account();
      account.status = AccountStatus.INACTIVE;

      const expectedErr = new IllegalStateError('inactive_account');
      expect(() => {
        account.setNewPassword('newHashedPassword');
      }).to.throw(expectedErr);
    });

    it('should correctly set new password for account', async () => {
      const account = new Account();
      account.password = 'oldHashedPassword';
      account.status = AccountStatus.ACTIVE;

      const newHashedPassword = 'newHashedPassword';
      account.setNewPassword('newHashedPassword');

      expect(account.password).equal(newHashedPassword);
    });
  });
});
