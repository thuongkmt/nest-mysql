import { Module } from '@nestjs/common';
import { ConnectedUserModule } from 'src/connected-user/connected-user.module';
import { UsersModule } from 'src/users/users.module';
import { ChatGateway } from './chat.gateway';

@Module({
  imports: [ConnectedUserModule, UsersModule],
  providers: [ChatGateway],
})
export class GatewayModule {}
