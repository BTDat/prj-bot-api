export interface BotRequestBody {
  username: string;
  password: string;
  betLevel: number;
}

export enum BotStatus {
  ACTIVATE = 'activate',
  DEACTIVATE = 'deactivate',
}
