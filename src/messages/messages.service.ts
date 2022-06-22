import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Message as MessageEntity } from 'src/typeorm';
import { CommonResponse } from 'src/types/common-response';
import { IMessage } from 'src/types/message.interface';
import { QueryOption } from 'src/types/query-option';
import { QueryUserChatTopic } from 'src/types/query-user-chattopic.interface';
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
    queryOption: QueryOption<QueryUserChatTopic>,
  ): Promise<CommonResponse<MessageEntity>> {
    const [results, total] = await this.messageRepository.findAndCount({
      where: { chatTopic: { id: queryOption.meta.chatTopicId } },
      take: queryOption.pageSize,
      skip: (queryOption.currentPage - 1) * queryOption.pageSize,
      order: { datetime: 'DESC' },
    });
    return new CommonResponse<MessageEntity>(results, total);
  }
}
