/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  globalInterceptor,
  inject,
  Interceptor,
  InvocationContext,
  InvocationResult,
  Provider,
  ValueOrPromise,
} from '@loopback/context';
import {Request, Response, RestBindings} from '@loopback/rest';
import helmet from 'helmet';

/**
 * This class will be bound to the application as an `Interceptor` during
 * `boot`
 */
@globalInterceptor('', {tags: {name: 'helmet'}})
export class HelmetInterceptor implements Provider<Interceptor> {
  constructor(
    @inject(RestBindings.Http.REQUEST) private readonly request: Request,
    @inject(RestBindings.Http.RESPONSE) private readonly response: Response,
  ) {}

  /**
   * This method is used by LoopBack context to produce an interceptor function
   * for the binding.
   *
   * @returns An interceptor function
   */
  value(): (
    context: InvocationContext,
    next: () => ValueOrPromise<InvocationResult>,
  ) => Promise<ValueOrPromise<InvocationResult>> {
    return this.intercept.bind(this);
  }

  /**
   * The logic to intercept an invocation
   * @param {InvocationContext} _context Invocation context
   * @param {() => ValueOrPromise<InvocationResult>} next A function to invoke next interceptor or the target method
   * @returns {Promise<any>}
   * @memberof HelmetInterceptor
   */
  async intercept(
    _context: InvocationContext,
    next: () => ValueOrPromise<InvocationResult>,
  ): Promise<any> {
    helmet(
      {
        contentSecurityPolicy: false,
      }
    )(this.request, this.response, () => null);
    return next();
  }
}
