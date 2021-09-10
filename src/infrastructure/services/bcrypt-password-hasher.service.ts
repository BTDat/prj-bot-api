import {compare, genSalt, hash} from 'bcryptjs';
import {bind} from '@loopback/context';
import {PasswordHasher} from '../../domain/services/password-hasher.service';

@bind()
export class BcryptPasswordHasher implements PasswordHasher {
  async hashPassword(password: string): Promise<string> {
    const salt = await genSalt();
    return hash(password, salt);
  }

  async comparePassword(string: string, hashedStr: string): Promise<boolean> {
    return compare(string, hashedStr);
  }
}
