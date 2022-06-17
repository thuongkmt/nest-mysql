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
import { ChattopicService } from 'src/chat-topic/chat-topic.service';
import { ConnectedUserService } from 'src/connected-user/connected-user.service';
import { ChatTopic, ConnectedUser, User, UserChatTopic } from 'src/typeorm';
import { PayloadMessage } from 'src/types/payload.message';
import { PayloadRoom } from 'src/types/payload.room';
import { UserChattopicService } from 'src/user-chattopic/user-chattopic.service';
import { UserService } from 'src/users/user.service';

@WebSocketGateway({ cors: '*' })
export class ChatGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  public constructor(
    private connectedUserService: ConnectedUserService,
    private userService: UserService,
    private chatTopicService: ChattopicService,
    private userChatTopicService: UserChattopicService,
  ) {}

  @WebSocketServer() server: Server;
  private logger: Logger = new Logger('ChatGateway');

  async afterInit(_server: any) {
    this.logger.log('Init');
  }

  @SubscribeMessage('send_message')
  async handleMessage(client: Socket, payload: PayloadMessage): Promise<void> {
    //check user in the ConnectedUser table
    const socketId: string = client.id;
    const currentConnectedUserId = await this.checkConnectedUser(socketId);
    //check payload
    this.logger.log(`${payload.chatTopic}: ${payload.message}`);
    //check ChatTopic whether or not existed?
    if (currentConnectedUserId && payload.chatTopic) {
      this.server
        .to(payload.chatTopic)
        .emit('receive_message', payload.message);
    }
  }

  @SubscribeMessage('join_room')
  async handleJoinRoom(client: Socket, room: string) {
    client.join(room);
  }

  @SubscribeMessage('left_room')
  async handleLeftRoom(client: Socket, room: string) {
    client.leave(room);
  }

  @SubscribeMessage('create_room')
  async handleRoomCreation(
    client: Socket,
    payload: PayloadRoom,
  ): Promise<void> {
    //check user in the ConnectedUser table
    const socketId: string = client.id;
    const currentConnectedUserId = await this.checkConnectedUser(socketId);
    if (currentConnectedUserId) {
      //create ChatTopic
      const userIds = payload.userIds.toString().split(',');
      let chatTopicName = '';
      userIds.forEach((x) => {
        chatTopicName += x;
      });
      const chatTopic = new ChatTopic();
      chatTopic.topic = chatTopicName;
      const chatTopicResult = await this.chatTopicService.create(chatTopic);
      //create user in the chatTopic
      if (chatTopicResult) {
        for (const userId of userIds) {
          const user = await this.userService.findById(parseInt(userId));
          const userChatTopic = new UserChatTopic();
          userChatTopic.chatTopic = chatTopicResult;
          userChatTopic.user = user;
          await this.userChatTopicService.create(userChatTopic);
        }
      }
    }
    this.server.to(`${socketId}`).emit('hey', 'You are created new chat-topic');
  }

  async handleConnection(socket: Socket, ..._args: any[]) {
    this.logger.log(`Client connected: ${socket.id}`);
    try {
      //TODO: Will get user from JWT
      //this.logger.log(client.handshake.headers);
      const userUat: User = await this.userService.findById(1);
      await this.connectedUserService.create({
        socketId: socket.id,
        user: userUat,
      });
    } catch (ex: any) {
      this.logger.log(`exception: ${ex}`);
    }
  }

  async handleDisconnect(socket: Socket) {
    this.logger.log(`Client disconnected: ${socket.id}`);
    const data = await this.connectedUserService.deleteConnectedUser(socket.id);
    this.logger.log(`${JSON.stringify(data)}`);
  }

  private async checkConnectedUser(socketId: string): Promise<number> {
    const currentConnectedUser =
      await this.connectedUserService.findUserBySocket(socketId);
    const currentConnectedUserId = currentConnectedUser.user.id;
    this.logger.log(
      `CurrentConnectedUser: ${JSON.stringify(currentConnectedUserId)}`,
    );

    return currentConnectedUserId;
  }
}
