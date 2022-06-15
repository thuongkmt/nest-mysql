import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatTopic } from 'src/typeorm';
import { ChattopicService } from './chat-topic.service';

@Module({
  imports: [TypeOrmModule.forFeature([ChatTopic])],
  providers: [ChattopicService],
  exports: [TypeOrmModule, ChattopicService],
})
export class ChatTopicModule {}
