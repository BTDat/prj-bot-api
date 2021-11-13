import {model, property, Entity, belongsTo} from '@loopback/repository';
import {Account} from './account.model';

@model({
  settings: {
    postgresql: {
      table: 'receipts',
    },
  },
})
export class Receipt extends Entity {
  @property({
    type: 'number',
    generated: true,
    id: true,
  })
  id: number;

  @property({
    type: 'number',
    postgresql: {
      dataType: 'double precision',
    },
  })
  profitRate: number;

  @belongsTo(
    () => Account,
    {},
    {
      postgresql: {
        columnName: 'accountId',
      },
    },
  )
  accountId: number;

  @property({
    type: 'number',
    required: true,
    postgresql: {
      dataType: 'double precision',
    },
  })
  balance: number;

  @property({
    type: 'number',
    required: true,
    postgresql: {
      dataType: 'double precision',
    },
  })
  profit: number;

  @property({
    type: 'date',
    postgresql: {
      columnName: 'createdAt',
    },
  })
  createdAt: Date;

  constructor(data?: Partial<Receipt>) {
    super(data);
  }
}
