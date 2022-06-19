import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Message as MessageEntity } from 'src/typeorm';
import { IMessage } from 'src/types/message.interface';
import { Repository } from 'typeorm';

@Injectable()
export class MessagesService {
  public constructor(
    @InjectRepository(MessageEntity)
    private readonly messageRepository: Repository<MessageEntity>,
  ) {}

  async create(messageEntity: IMessage): Promise<IMessage> {
    return this.messageRepository.save(messageEntity);
  }

  async findByUserAndChatTopic(
    chatTopicId: number,
    userId?: number,
  ): Promise<MessageEntity[]> {
    return this.messageRepository.find({
      where: { user: { id: userId }, chatTopic: { id: chatTopicId } },
    });
  }
}
