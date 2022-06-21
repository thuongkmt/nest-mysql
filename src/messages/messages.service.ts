import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IPaginationMeta, Pagination } from 'nestjs-typeorm-paginate';
import { Message as MessageEntity } from 'src/typeorm';
import { CommonResponse } from 'src/types/common-response.interface';
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
  ): Promise<CommonResponse<MessageEntity>> {
    const [results, total] = await this.messageRepository.findAndCount({
      where: { user: { id: userId }, chatTopic: { id: chatTopicId } },
      take: 5,
      skip: 0,
      order: { datetime: 'DESC' },
    });
    return new CommonResponse<MessageEntity>(results, total);
  }
}
