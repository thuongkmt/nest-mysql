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
import { MessagesService } from 'src/messages/messages.service';
import { ChatTopic, User, UserChatTopic } from 'src/typeorm';
import { LoadMessage } from 'src/types/load-message.interface';
import { PayloadMessage } from 'src/types/payload.message.interface';
import { PayloadRoom } from 'src/types/payload.room.interface';
import { QueryOption } from 'src/types/query-option';
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
    private messageService: MessagesService,
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
      const user = await this.userService.findById(currentConnectedUserId);
      const chatTopic = await this.chatTopicService.getByTopic(
        payload.chatTopic,
      );
      //save message into db
      const message = await this.messageService.create({
        text: payload.message,
        datetime: new Date(Date.now()).toLocaleString(),
        chatTopic: chatTopic,
        user: user,
      });
      //emit back to the clients that in this rooms
      this.server.to(payload.chatTopic).emit('receive_message', message);
    }
  }

  @SubscribeMessage('load_message')
  async handleLoadMessage(client: Socket, payload: LoadMessage) {
    const messages = await this.messageService.findByUserAndChatTopic(
      new QueryOption(
        { chatTopicId: payload.chatTopicId },
        payload.currentPage,
      ),
    );

    this.server
      .to(payload.chatTopicId.toString())
      .emit('receive_message', messages);
  }

  @SubscribeMessage('rooms')
  async handleRooms(client: Socket) {
    const userId = client.handshake.headers.userid.toString();
    this.logger.log(`userId: ${userId}`);
    const rooms = await this.userChatTopicService.findByUserId(
      parseInt(userId),
    );
    this.logger.log(`rooms: ${rooms}`);
    this.server.to(client.id).emit('rooms', rooms);
  }

  @SubscribeMessage('join_room')
  async handleJoinRoom(client: Socket, room: PayloadRoom) {
    //response list of history message in db back of certain room_id
    const messages = await this.messageService.findByUserAndChatTopic(
      new QueryOption({ chatTopicId: room.chatTopicId }, 1),
    );
    client.join(room.chatTopicId.toString());
    //return data of room for user
    this.server
      .to(room.chatTopicId.toString())
      .emit('receive_message', messages);
    this.logger.log(
      `Joined room ${room.chatTopicId.toString()} for message ${JSON.stringify(
        messages,
      )}`,
    );
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
      //TODO: Will get user from JWT through this.logger.log(socket.handshake.headers);
      const userId = socket.handshake.headers.userid.toString();
      const userUat: User = await this.userService.findById(parseInt(userId));
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
