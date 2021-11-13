import {bind} from '@loopback/context';
import {Request, RequestStatus} from '../models/request.model';

@bind()
export class RequestFactory {
  constructor() {}
  public async buildRequest(
    values: Pick<Request, 'type' | 'data'>,
  ): Promise<Request> {
    return new Request({
      ...values,
      status: RequestStatus.PENDING,
    });
  }
}
