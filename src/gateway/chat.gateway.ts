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
    this.logger.log(`${payload.chatTopicId}: ${payload.message}`);
    //check ChatTopic whether or not existed?
    if (currentConnectedUserId && payload.chatTopicId) {
      const user = await this.userService.findById(currentConnectedUserId);
      const chatTopic = await this.chatTopicService.getById(
        payload.chatTopicId,
      );
      //save message into db
      const message = await this.messageService.create({
        text: payload.message,
        datetime: new Date(Date.now()).toLocaleString(),
        chatTopic: chatTopic,
        user: user,
      });
      //emit back to the clients that in this rooms
      this.server
        .to(payload.chatTopicId.toString())
        .emit('receive_message', message);
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
    const currentConnectedUserId = await this.checkConnectedUser(client.id);
    if (currentConnectedUserId) {
      this.logger.log(`[Infor][rooms] UserId: ${currentConnectedUserId}`);
      const rooms = await this.userChatTopicService.findByUserId(
        currentConnectedUserId,
      );
      this.logger.log(
        `[Infor][rooms] Get list of room: ${JSON.stringify(rooms)}`,
      );
      this.server.to(client.id).emit('rooms', rooms);
    } else {
      this.logger.log(`[Infor][rooms] User is not connected`);
      this.server.to(`${client.id}`).emit('error', 'User is not connected');
    }
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
      const userRootIds = payload.userIds.toString().split(',');
      let chatTopicName = '';

      for (const userRootId of userRootIds) {
        chatTopicName += `${userRootId}_`;
      }
      if (chatTopicName.length > 0) {
        chatTopicName.substring(chatTopicName.length - 1, chatTopicName.length);
        this.logger.log(
          `[Infor][create_room] new chatTopicName: ${chatTopicName}`,
        );
      }
      const chatTopic = new ChatTopic();
      chatTopic.topic = chatTopicName;
      const chatTopicResult = await this.chatTopicService.create(chatTopic);
      //create user in the chatTopic
      if (chatTopicResult) {
        for (const userRootId of userRootIds) {
          //check user was synced or not
          const user = await this.userService.findByRootUserId(userRootId);
          const userChatTopic = new UserChatTopic();
          userChatTopic.chatTopic = chatTopicResult;
          userChatTopic.user = user;
          await this.userChatTopicService.create(userChatTopic);
        }
        this.server
          .to(`${socketId}`)
          .emit('create_room', `New room with id: ${chatTopicResult.id}`);
      }
    }
  }

  async handleConnection(socket: Socket, ..._args: any[]) {
    try {
      this.logger.log(`[Infor]: Client connected ${socket.id}`);
      //get token
      const userToken = await this.verifyToken(socket);
      //verify token
      this.logger.log(`[Infor]: token ${userToken}`);
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
    this.logger.log(`[infor]: headers ${JSON.stringify(header)}`);
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
        } else {
          this.logger.log(`[infor]: Jwt is not right format!`);
          this.server
            .to(`${socket.id}`)
            .emit('error', 'Jwt is not right format!');
        }
      } catch (err) {
        this.logger.error(`[error]: ${err}`);
        this.server.to(`${socket.id}`).emit('error', err.message);
        return null;
      }
    } else {
      this.logger.log(`[infor]: Not authrized`);
      this.server.to(`${socket.id}`).emit('error', 'Not authrized');
    }
  }
}
