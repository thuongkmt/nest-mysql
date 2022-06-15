import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserChatTopic } from 'src/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class UserChattopicService {
  public constructor(
    @InjectRepository(UserChatTopic)
    private readonly userChatTopicRepository: Repository<UserChatTopic>,
  ) {}

  async create(userChatTopic: UserChatTopic): Promise<UserChatTopic> {
    return this.userChatTopicRepository.save(userChatTopic);
  }

  async findByUserId(userId: number): Promise<UserChatTopic[]> {
    return this.userChatTopicRepository.find({
      relations: ['chatTopic', 'user'],
      where: {
        user: {
          id: userId,
        },
      },
    });
  }

  async findByChatTopicId(chatTopicId: number): Promise<UserChatTopic[]> {
    return this.userChatTopicRepository.find({
      relations: ['chatTopic', 'user'],
      where: {
        chatTopic: {
          id: chatTopicId,
        },
      },
    });
  }
}
