import { Module } from '@nestjs/common';
import { ChatTopicModule } from 'src/chat-topic/chat-topic.module';
import { ConnectedUserModule } from 'src/connected-user/connected-user.module';
import { UserChattopicModule } from 'src/user-chattopic/user-chattopic.module';
import { UsersModule } from 'src/users/users.module';
import { ChatGateway } from './chat.gateway';

@Module({
  imports: [
    ConnectedUserModule,
    UsersModule,
    ChatTopicModule,
    UserChattopicModule,
  ],
  providers: [ChatGateway],
})
export class GatewayModule {}
