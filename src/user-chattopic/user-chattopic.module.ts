import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserChatTopic } from 'src/typeorm';
import { UserChattopicService } from './user-chattopic.service';

@Module({
  imports: [TypeOrmModule.forFeature([UserChatTopic])],
  providers: [UserChattopicService],
  exports: [TypeOrmModule, UserChattopicService],
})
export class UserChattopicModule {}
