// import {
//   createStubInstance,
//   expect,
//   StubbedInstanceWithSinonAccessor,
// } from '@loopback/testlab';
// import {AccountRepository} from '../../../../infrastructure/repositories';
// import {AccountFactory} from '../../../../domain/services/account-factory.service';
// import {BcryptPasswordHasher} from '../../../../infrastructure/services/bcrypt-password-hasher.service';
// import {Role} from '../../../../domain/models/account.model';
// import {IllegalArgumentError} from '../../../../domain/errors/illegal-argument.error';
// import {PasswordHasher} from '../../../../domain/services/password-hasher.service';

// describe('account-factory.service', () => {
//   let accountRepository: StubbedInstanceWithSinonAccessor<AccountRepository>;
//   let passwordHasher: PasswordHasher;

//   // Prepare dependencies to inject.
//   const givenDependenciesPrepared = () => {
//     accountRepository = createStubInstance(AccountRepository);
//     passwordHasher = new BcryptPasswordHasher();
//   };
//   beforeEach(givenDependenciesPrepared);

//   describe('buildAccount()', () => {
//     it('should throw error if email already registered', async () => {
//       accountRepository.stubs.emailRegistered.resolves(true);

//       const accountFactory = new AccountFactory(
//         accountRepository,
//         passwordHasher,
//       );

//       const accountData = {
//         firstName: 'Day',
//         lastName: 'One',
//         email: 'test@dayoneteams.com',
//         password: '123456',
//         role: Role.ROOT_ADMIN,
//       };

//       const expectedErr = new IllegalArgumentError('email_registered');
//       // eslint-disable-next-line @typescript-eslint/no-floating-promises
//       expect(accountFactory.buildAccount(accountData)).to.be.rejectedWith(
//         expectedErr,
//       );
//     });

//     it('should build account with active status and password hashed using bcrypt', async () => {
//       accountRepository.stubs.emailRegistered.resolves(false);

//       const accountFactory = new AccountFactory(
//         accountRepository,
//         passwordHasher,
//       );

//       const accountData = {
//         firstName: 'Day',
//         lastName: 'One',
//         email: 'test@dayoneteams.com',
//         password: '123456',
//         role: Role.ROOT_ADMIN,
//       };

//       const account = await accountFactory.buildAccount(accountData);
//       expect(account.password).startWith('$2a'); // bcrypt hashed string starts with $2a
//       expect(account.isActive()).to.be.ok();
//     });
//   });
// });
