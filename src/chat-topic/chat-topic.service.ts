import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ChatTopic } from 'src/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class ChattopicService {
  public constructor(
    @InjectRepository(ChatTopic)
    private readonly chattopicRepository: Repository<ChatTopic>,
  ) {}

  async create(chatTopic: ChatTopic): Promise<ChatTopic> {
    return this.chattopicRepository.save(chatTopic);
  }

  async getById(id: number): Promise<ChatTopic> {
    return this.chattopicRepository.findOne({ where: { id: id } });
  }
}
