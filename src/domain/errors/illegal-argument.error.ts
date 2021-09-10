import {DomainError} from './domain-error.error';

export class IllegalArgumentError extends DomainError {
  constructor(code = 'illegal_argument', message?: string) {
    super(code, message);
    this.name = 'IllegalArgumentError';
  }
}
