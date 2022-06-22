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
import { JwtService } from '@nestjs/jwt';
import { IUserToken } from 'src/types/user-token.interface';
import { IUser } from 'src/types/user.interface';

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
    private jwtTokenService: JwtService,
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
    const messages = await this.messageService.findByChatTopic(
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
    this.logger.log(`[Infor][rooms] userId: ${userId}`);
    const rooms = await this.userChatTopicService.findByUserId(
      parseInt(userId),
    );
    this.logger.log(`[Infor][rooms]: get list of room: ${rooms}`);
    this.server.to(client.id).emit('rooms', rooms);
  }

  @SubscribeMessage('join_room')
  async handleJoinRoom(client: Socket, room: PayloadRoom) {
    //response list of history message in db back of certain room_id
    const messages = await this.messageService.findByChatTopic(
      new QueryOption({ chatTopicId: room.chatTopicId }, 1),
    );
    client.join(room.chatTopicId.toString());
    //return data of room for user
    this.server
      .to(room.chatTopicId.toString())
      .emit('receive_message', messages);
    this.logger.log(
      `[Infor]: Joined room ${room.chatTopicId.toString()} for message ${JSON.stringify(
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
    try {
      this.logger.log(`[Infor]: Client connected ${socket.id}`);
      //get token
      const userToken = await this.verifyToken(socket);
      //verify token
      if (userToken) {
        //check user if exist or not
        const exitedUser = await this.userService.findByRootUserId(
          userToken.userId,
        );
        this.logger.log(`[infor]: exitedUser ${JSON.stringify(exitedUser)}`);
        let currentUser: IUser;
        if (exitedUser) {
          currentUser = exitedUser;
        } else {
          const newUser = await this.userService.create({
            rootUserId: userToken.userId,
            username: userToken.username,
          });
          currentUser = newUser;
        }
        //check connectedUser exist or not
        const connectedUser = await this.connectedUserService.findByUser(
          currentUser.id,
        );
        if (connectedUser) {
          //update
          connectedUser.socketId = socket.id;
          await this.connectedUserService.create(connectedUser);
        } else {
          //save session for current user
          await this.connectedUserService.create({
            socketId: socket.id,
            user: currentUser,
          });
        }
      } else {
        this.server.disconnectSockets(true);
      }
    } catch (ex: any) {
      this.logger.log(`exception: ${ex}`);
    }
  }

  async handleDisconnect(socket: Socket) {
    const data = await this.connectedUserService.deleteConnectedUser(socket.id);
    this.logger.log(`[infor]: Client disconnected ${JSON.stringify(data)}`);
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

  private async verifyToken(socket: Socket): Promise<IUserToken | null> {
    //TODO: Will get user from JWT through this.logger.log(socket.handshake.headers);
    const header = socket.handshake.headers;
    if (header['authorization']) {
      try {
        const authorization = header['authorization'].split(' ');
        if (authorization[0] == 'Bearer') {
          const token: IUserToken = this.jwtTokenService.verify(
            authorization[1],
            {
              secret: '8U2c3N2xkiRwFp',
            },
          );
          this.logger.log(`[infor]: token ${JSON.stringify(token)}`);
          return token;
        }
      } catch (err) {
        this.logger.log(`[error]: ${err}`);
        this.server.to(`${socket.id}`).emit('error', err.message);
        return null;
      }
    } else {
      this.logger.log(`[infor]: Not authrized`);
      this.server.to(`${socket.id}`).emit('error', 'Not authrized');
    }
  }
}
