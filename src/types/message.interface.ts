import { ChatTopic, User } from 'src/typeorm';

export class IMessage {
  id?: number;
  text: string;
  datetime: string;
  chatTopic: ChatTopic;
  user: User;
}
