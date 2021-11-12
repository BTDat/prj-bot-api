import {Account} from '../models/account.model';

export interface AccountRepository {
  emailRegistered(email: string): Promise<boolean>;
  usernameRegistered(username: string): Promise<boolean>;
  findByEmail(email: string): Promise<Account | null>;
  findByUsername(username: string): Promise<Account | null>;
  isUserNameValid(username: string): boolean;
}
