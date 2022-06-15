import { Logger } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';
import { ConnectedUserService } from 'src/connected-user/connected-user.service';
import { User } from 'src/typeorm';
import { PayloadMessage } from 'src/types/payload.message';
import { IUser } from 'src/types/user.interface';
import { UserService } from 'src/users/user.service';

@WebSocketGateway({ cors: '*' })
export class ChatGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  public constructor(
    private connectedUserService: ConnectedUserService,
    private userService: UserService,
  ) {}

  @WebSocketServer() server: Server;
  private logger: Logger = new Logger('ChatGateway');

  @SubscribeMessage('msgToServer')
  handleMessage(client: Socket, payload: PayloadMessage): void {
    //this.logger.log(`message sent from ${client.id} with payload ${payload}`);
    this.logger.log(client.handshake.headers);
    //1. get sender userId from headers
    this.logger.log(payload);
    this.logger.log(payload.username);
    this.logger.log(payload.message);
    //2. get receiver from payload
    this.server.sockets.emit('msgToClient', payload);
  }

  afterInit(_server: any) {
    this.logger.log('Init');
  }

  async handleConnection(socket: Socket, ..._args: any[]) {
    this.logger.log(`Client connected: ${socket.id}`);
    const userUat: User = await this.userService.findByUsername(1);
    await this.connectedUserService.create({
      socketId: socket.id,
      user: userUat,
    });
  }

  handleDisconnect(client: any) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }
}
