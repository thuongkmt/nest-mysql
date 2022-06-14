import { Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { ChatTopic } from './ChatTopic';
import { User } from './User';

@Entity()
export class UserChatTopic {
  @PrimaryGeneratedColumn({
    type: 'bigint',
  })
  id: number;

  @ManyToOne(() => ChatTopic, (chatTopic) => chatTopic.userChatTopics)
  chatTopic: ChatTopic;

  @ManyToOne(() => User, (user) => user.userChatTopics)
  user: User;
}
