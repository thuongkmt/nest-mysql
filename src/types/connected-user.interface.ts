import { IUser } from './user.interface';

export interface IConnectedUser {
  id?: number;
  socketId: string;
  user: IUser;
}
