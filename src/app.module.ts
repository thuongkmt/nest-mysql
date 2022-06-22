import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';
import { GatewayModule } from './gateway/gateway.module';
import { ConnectedUserModule } from './connected-user/connected-user.module';
import { ChatTopicModule } from './chat-topic/chat-topic.module';
import { UserChattopicModule } from './user-chattopic/user-chattopic.module';
import { MessagesModule } from './messages/messages.module';
import entities from './typeorm';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: '194.127.192.210',
      port: 3307,
      username: 'root',
      password: 'root@123',
      database: 'chatapp',
      entities: entities,
      synchronize: true,
    }),
    UsersModule,
    GatewayModule,
    ConnectedUserModule,
    ChatTopicModule,
    UserChattopicModule,
    MessagesModule,
  ],
  providers: [],
})
export class AppModule {}
