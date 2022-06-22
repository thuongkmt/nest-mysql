import {
  BaseEntity,
  Column,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Message } from './Message';
import { UserChatTopic } from './UserChatTopic';

@Entity()
export class User extends BaseEntity {
  @PrimaryGeneratedColumn({
    type: 'bigint',
  })
  id: number;

  @Column({
    nullable: false,
  })
  rootUserId: string;

  @Column({
    nullable: false,
  })
  username: string;

  @OneToMany(() => UserChatTopic, (userChatTopic) => userChatTopic.user)
  userChatTopics: UserChatTopic[];

  @OneToMany(() => Message, (message) => message.user)
  messages: Message[];

  @Column({
    default: false,
  })
  isDelete: boolean;
}
