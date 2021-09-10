import {Account} from '../models/account.model';

export interface AccountRepository {
  emailRegistered(email: string): Promise<boolean>;
  findByEmail(email: string): Promise<Account | null>;
}
