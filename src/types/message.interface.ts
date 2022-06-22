import { ChatTopic, User } from 'src/typeorm';

export interface IMessage {
  id?: number;
  text: string;
  datetime: string;
  chatTopic: ChatTopic;
  user: User;
}
