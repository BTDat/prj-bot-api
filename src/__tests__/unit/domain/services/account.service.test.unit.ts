// import {expect} from '@loopback/testlab';
// import {BcryptPasswordHasher} from '../../../../infrastructure/services/bcrypt-password-hasher.service';
// import {
//   Account,
//   AccountStatus,
//   Role,
// } from '../../../../domain/models/account.model';
// import {PasswordHasher} from '../../../../domain/services/password-hasher.service';
// import {AccountService} from '../../../../domain/services/account.service';

// describe('account.service', () => {
//   let passwordHasher: PasswordHasher;

//   // Prepare dependencies to inject.
//   const givenDependenciesPrepared = () => {
//     passwordHasher = new BcryptPasswordHasher();
//   };
//   beforeEach(givenDependenciesPrepared);

//   describe('setNewPassword()', () => {
//     it('should assign new password hashed with bcrypt', async () => {
//       const accountService = new AccountService(passwordHasher);

//       const oldPassword = await passwordHasher.hashPassword('123456');
//       const account = new Account({
//         firstName: 'Day',
//         lastName: 'One',
//         email: 'test@dayoneteams.com',
//         password: oldPassword,
//         role: Role.ROOT_ADMIN,
//         status: AccountStatus.ACTIVE,
//       });

//       const newPassword = '1234567';
//       await accountService.setNewPassword(account, newPassword);

//       expect(account.password).to.startWith('$2a');
//       expect(
//         passwordHasher.comparePassword(newPassword, account.password),
//       ).to.be.ok();
//       expect(account.password).to.not.equal(oldPassword);
//     });
//   });
// });
