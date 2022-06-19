import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Message } from './Message';
import { UserChatTopic } from './UserChatTopic';

@Entity()
export class ChatTopic {
  @PrimaryGeneratedColumn({
    type: 'bigint',
  })
  id: number;

  @Column()
  topic: string;

  @Column({
    default: '',
  })
  password: string;

  @OneToMany(() => Message, (message) => message.chatTopic)
  messages: Message[];

  @OneToMany(() => UserChatTopic, (userChatTopic) => userChatTopic.chatTopic)
  userChatTopics: UserChatTopic[];

  @Column({
    default: false,
  })
  isDelete: boolean;
}
