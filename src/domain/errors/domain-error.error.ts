export class DomainError extends Error {
  code?: string;

  constructor(code = 'domain_error', message?: string) {
    super(message);
    this.code = code;
    this.name = 'DomainError';
  }
}
