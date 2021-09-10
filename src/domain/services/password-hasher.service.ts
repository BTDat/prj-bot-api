export interface PasswordHasher {
  hashPassword(password: string): Promise<string>;
  comparePassword(str: string, hashedStr: string): Promise<boolean>;
}
