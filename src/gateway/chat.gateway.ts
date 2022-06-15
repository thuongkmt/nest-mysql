import { Logger } from '@nestjs/common';
import {
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { json } from 'body-parser';
import { Socket, Server } from 'socket.io';
import { PayloadMessage } from 'src/types/payload.message';

@WebSocketGateway({ cors: '*' })
export class ChatGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
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

  handleConnection(client: any, ..._args: any[]) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: any) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }
}
