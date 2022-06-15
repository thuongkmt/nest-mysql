import { Message, UserChatTopic } from 'src/typeorm';

export class CreateChatTopicDto {
  id?: number;
  topic: string;
  password: string;
  messages: Message[];
  userChatTopics: UserChatTopic[];
}
