import {DomainError} from './domain-error.error';

export class IllegalStateError extends DomainError {
  constructor(code = 'illegal_state', message?: string) {
    super(code, message);
    this.name = 'IllegalStateError';
  }
}
