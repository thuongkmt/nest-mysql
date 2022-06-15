import { User } from 'src/typeorm';

export interface IConnectedUser {
  id?: number;
  socketId: string;
  user: User;
}
