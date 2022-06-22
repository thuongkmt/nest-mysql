import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { ChatTopic } from './ChatTopic';
import { User } from './User';

@Entity()
export class Message {
  @PrimaryGeneratedColumn({
    type: 'bigint',
  })
  id: number;

  @Column()
  text: string;

  @Column({
    default: null,
    nullable: true,
  })
  imgUrl: string;

  @Column({
    default: null,
    nullable: true,
  })
  videoUrl: string;

  @Column({
    default: null,
    nullable: true,
  })
  url: string;

  @Column({
    nullable: false,
  })
  datetime: string;

  @ManyToOne(() => ChatTopic, (chatTopic) => chatTopic.messages)
  chatTopic: ChatTopic;

  @ManyToOne(() => User, (user) => user.messages)
  user: User;

  @Column({
    default: false,
  })
  isDelete: boolean;
}
