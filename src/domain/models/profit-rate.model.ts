import {model, property, Entity} from '@loopback/repository';

export enum ProfitRateStatus {
  INACTIVE = 'inactive',
  ACTIVE = 'active',
}

@model({
  settings: {
    postgresql: {
      table: 'profit_rates',
    },
  },
})
export class ProfitRate extends Entity {
  @property({
    type: 'number',
    generated: true,
    id: true,
  })
  id: number;

  @property({
    type: 'number',
    required: true,
    postgresql: {
      dataType: 'double precision',
    },
  })
  rate: number;

  @property({type: 'string'})
  status: ProfitRateStatus;

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

  constructor(data?: Partial<ProfitRate>) {
    super(data);
  }
}
