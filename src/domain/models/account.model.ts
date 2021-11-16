import {model, property, Entity} from '@loopback/repository';
import {
  assertStateFalse,
  assertStateTrue,
} from '../helpers/assertion-concern.helper';
import {BotStatus} from './bot.model';

export namespace AccountConstraint {
  export const PASSWORD_MIN_LENGTH = 6;
  export const PASSWORD_MAX_LENGTH = 24;
}

export enum Role {
  ROOT_ADMIN = 'root_admin',
  USER = 'user',
}

export enum AccountStatus {
  INACTIVE = 'inactive',
  ACTIVE = 'active',
}

export interface RawAccount {
  password: string;
  account: Account;
}

@model({
  settings: {
    indexes: {
      uniqueEmail: {
        keys: {
          email: 1,
        },
        options: {
          unique: true,
        },
      },
    },
    hiddenProperties: ['password'],
  },
})
export class Account extends Entity {
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
      columnName: 'profitRate',
    },
  })
  profitRate: number;

  @property({
    type: 'string',
    required: true,
    index: {
      unique: true,
    },
  })
  username: string;

  @property({
    type: 'string',
    required: true,
    index: {
      unique: true,
    },
    jsonSchema: {
      format: 'email',
    },
  })
  email: string;

  @property({
    type: 'string',
    required: true,
    jsonSchema: {
      minLength: 6,
      maxLength: 24,
    },
  })
  password: string;

  @property({type: 'string'})
  role: Role;

  @property({type: 'string'})
  status: AccountStatus;

  @property({
    type: 'string',
    default: BotStatus.DEACTIVATE,
    postgresql: {
      columnName: 'botStatus',
    },
  })
  botStatus: BotStatus;

  @property({
    type: 'string',
    jsonSchema: {
      minLength: 1,
      maxLength: 256,
    },
    postgresql: {
      columnName: 'firstName',
    },
  })
  firstName: string;

  @property({
    type: 'string',
    jsonSchema: {
      minLength: 1,
      maxLength: 256,
    },
    postgresql: {
      columnName: 'lastName',
    },
  })
  lastName: string;

  @property({
    type: 'boolean',
    default: false,
    postgresql: {
      columnName: 'emailVerified',
    },
  })
  emailVerified: boolean;

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

  constructor(data?: Partial<Account>) {
    super(data);
  }

  public canVerifyEmail(): boolean {
    return (
      this.isActive() && this.role !== Role.ROOT_ADMIN && !this.emailVerified
    );
  }

  public verify(): void {
    assertStateTrue(this.isActive(), 'inactive_account');
    assertStateFalse(this.emailVerified, 'already_verified');

    this.emailVerified = true;
  }

  public isActive(): boolean {
    return this.status === AccountStatus.ACTIVE;
  }

  public setNewPassword(newPassword: string) {
    assertStateTrue(this.isActive(), 'inactive_account');

    this.password = newPassword;
  }
}
