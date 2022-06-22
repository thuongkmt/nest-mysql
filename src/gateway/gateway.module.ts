import { Module } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ChatTopicModule } from 'src/chat-topic/chat-topic.module';
import { ConnectedUserModule } from 'src/connected-user/connected-user.module';
import { MessagesModule } from 'src/messages/messages.module';
import { UserChattopicModule } from 'src/user-chattopic/user-chattopic.module';
import { UsersModule } from 'src/users/users.module';
import { ChatGateway } from './chat.gateway';

@Module({
  imports: [
    ConnectedUserModule,
    UsersModule,
    ChatTopicModule,
    UserChattopicModule,
    MessagesModule,
  ],
  providers: [ChatGateway, JwtService],
})
export class GatewayModule {}
