import {model, property, Entity} from '@loopback/repository';

export enum RequestType {
  SIGN_UP = 'signup',
}

export enum RequestStatus {
  PENDING = 'pending',
  SUCCESS = 'success',
  DENIED = 'denied',
}

export interface SignupRequest {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  description: string;
}

@model({
  settings: {
    postgresql: {
      table: 'requests',
    },
  },
})
export class Request extends Entity {
  @property({
    type: 'number',
    generated: true,
    id: true,
  })
  id: number;

  @property({
    type: 'string',
    required: true,
  })
  type: RequestType;

  @property({
    type: 'string',
    required: true,
  })
  status: RequestStatus;

  @property({
    type: 'object',
    postgresql: {
      dataType: 'json',
    },
  })
  data: SignupRequest;

  @property({
    type: 'date',
    postgresql: {
      columnName: 'createdAt',
    },
  })
  createdAt: Date;

  @property({
    type: 'date',
    postgresql: {
      columnName: 'updatedAt',
    },
  })
  updatedAt: Date;

  constructor(data?: Partial<Request>) {
    super(data);
  }
}
