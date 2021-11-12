import {
  createStubInstance,
  expect,
  StubbedInstanceWithSinonAccessor,
} from '@loopback/testlab';
import {HttpErrors} from '@loopback/rest';
import {
  Account,
  AccountStatus,
  Role,
} from '../../../../domain/models/account.model';
import {AccountSendMailFactory} from '../../../../application/services/account-send-mail-factory.service';
import {ConfigurationRepository} from '../../../../infrastructure/repositories';
import {AccountTokenService} from '../../../../application/services/account-token.service';
import {VerifyAccountSettings} from '../../../../domain/models/configuration.model';

describe('account-email-factory.service', () => {
  const frontEndBaseUrl = 'http://localhost:3000';
  let configurationRepository: StubbedInstanceWithSinonAccessor<ConfigurationRepository>;
  let accountTokenService: StubbedInstanceWithSinonAccessor<AccountTokenService>;

  // Prepare dependencies to inject.
  const givenDependenciesPrepared = () => {
    configurationRepository = createStubInstance(ConfigurationRepository);
    accountTokenService = createStubInstance(AccountTokenService);
  };
  beforeEach(givenDependenciesPrepared);

  describe('buildAccountVerificationEmail()', () => {
    it('should throw error if email is belong to root_admin account', async () => {
      const accountSendMailFactory = new AccountSendMailFactory(
        configurationRepository,
        accountTokenService,
        frontEndBaseUrl,
      );

      const adminAccount = new Account({
        firstName: 'Day',
        lastName: 'One',
        email: 'test@dayoneteams.com',
        password: '123456hash',
        role: Role.ROOT_ADMIN,
        status: AccountStatus.ACTIVE,
      });

      const expectedErr = new HttpErrors.Forbidden('invalid_account');
      expect(
        accountSendMailFactory.buildAccountVerificationEmail(adminAccount),
      ).to.be.rejectedWith(expectedErr);
    });

    it('should throw error if account is inactive', async () => {
      const accountSendMailFactory = new AccountSendMailFactory(
        configurationRepository,
        accountTokenService,
        frontEndBaseUrl,
      );

      const inactiveAccount = new Account({
        firstName: 'Day',
        lastName: 'One',
        email: 'test@dayoneteams.com',
        password: '123456hash',
        role: Role.USER,
        status: AccountStatus.INACTIVE,
      });

      const expectedErr = new HttpErrors.Forbidden('invalid_account');
      expect(
        accountSendMailFactory.buildAccountVerificationEmail(inactiveAccount),
      ).to.be.rejectedWith(expectedErr);
    });

    it('should throw error if account is already verified', async () => {
      const accountSendMailFactory = new AccountSendMailFactory(
        configurationRepository,
        accountTokenService,
        frontEndBaseUrl,
      );

      const alreadyVerifiedAccount = new Account({
        firstName: 'Day',
        lastName: 'One',
        email: 'test@dayoneteams.com',
        password: '123456hash',
        role: Role.USER,
        status: AccountStatus.ACTIVE,
        emailVerified: true,
      });

      const expectedErr = new HttpErrors.Forbidden('invalid_account');
      expect(
        accountSendMailFactory.buildAccountVerificationEmail(
          alreadyVerifiedAccount,
        ),
      ).to.be.rejectedWith(expectedErr);
    });

    it('should throw error if verification email settings not existed', async () => {
      configurationRepository.stubs.getAccountVerificationEmailSettings.resolves(
        undefined,
      );
      const accountSendMailFactory = new AccountSendMailFactory(
        configurationRepository,
        accountTokenService,
        frontEndBaseUrl,
      );

      const account = new Account({
        firstName: 'Day',
        lastName: 'One',
        email: 'test@dayoneteams.com',
        password: '123456hash',
        role: Role.USER,
        status: AccountStatus.ACTIVE,
        emailVerified: false,
      });

      const expectedErr = new Error('email_settings_not_found');
      expect(
        accountSendMailFactory.buildAccountVerificationEmail(account),
      ).to.be.rejectedWith(expectedErr);
    });

    it('should generate verification link and append to email content', async () => {
      const dummyEmailSettings = new VerifyAccountSettings({
        emailTemplate:
          'Hi. This is your verification link: <%=ACCOUNT_VERIFICATION_LINK%>',
        subject: 'Account verification',
        senderEmail: 'test@dayoneteams.com',
        senderName: 'DayOne',
      });
      configurationRepository.stubs.getAccountVerificationEmailSettings.resolves(
        dummyEmailSettings,
      );
      const dummyToken = 'dummyToken';
      accountTokenService.stubs.generateAccountVerificationToken.returns(
        dummyToken,
      );
      const accountSendMailFactory = new AccountSendMailFactory(
        configurationRepository,
        accountTokenService,
        frontEndBaseUrl,
      );

      const account = new Account({
        firstName: 'Day',
        lastName: 'One',
        email: 'test@dayoneteams.com',
        password: '123456hash',
        role: Role.USER,
        status: AccountStatus.ACTIVE,
        emailVerified: false,
      });

      const email = await accountSendMailFactory.buildAccountVerificationEmail(
        account,
      );
      expect(email).to.deepEqual({
        subject: dummyEmailSettings.subject,
        senderEmail: dummyEmailSettings.senderEmail,
        senderName: dummyEmailSettings.senderName,
        content: `Hi. This is your verification link: http://localhost:3000/verify-account?token=${dummyToken}`,
        recipient: account.email,
      });
    });
  });
});
