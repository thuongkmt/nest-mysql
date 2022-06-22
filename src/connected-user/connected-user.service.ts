import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConnectedUser } from 'src/typeorm/ConnectedUser';
import { User } from 'src/typeorm/User';
import { IConnectedUser } from 'src/types/connected-user.interface';
import { DeleteResult, Repository } from 'typeorm';

@Injectable()
export class ConnectedUserService {
  public constructor(
    @InjectRepository(ConnectedUser)
    private readonly connectedUserRepository: Repository<ConnectedUser>,
  ) {}

  async create(connectedUser: IConnectedUser): Promise<IConnectedUser> {
    return this.connectedUserRepository.save(connectedUser);
  }

  async findByUser(userId: number): Promise<ConnectedUser> {
    return this.connectedUserRepository.findOne({
      relations: ['user'],
      where: { user: { id: userId } },
    });
  }

  async findUserBySocket(socketId: string): Promise<ConnectedUser> {
    return this.connectedUserRepository.findOne({
      relations: ['user'],
      where: { socketId: socketId },
    });
  }

  async deleteConnectedUser(socketId: string): Promise<DeleteResult> {
    return this.connectedUserRepository.delete({ socketId: socketId });
  }
}
