export interface BotRequestBody {
  username: string;
  password: string;
  betLevel: number;
}

export enum BotStatus {
  ACTIVATE = 'active',
  DEACTIVATE = 'deactivate',
}
