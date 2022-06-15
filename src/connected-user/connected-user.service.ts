import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConnectedUser } from 'src/typeorm/ConnectedUser';
import { User } from 'src/typeorm/User';
import { IConnectedUser } from 'src/types/connected-user.interface';
import { Repository } from 'typeorm';

@Injectable()
export class ConnectedUserService {
  public constructor(
    @InjectRepository(ConnectedUser)
    private readonly connectedUserRepository: Repository<ConnectedUser>,
  ) {}

  async create(connectedUser: IConnectedUser): Promise<IConnectedUser> {
    return this.connectedUserRepository.save(connectedUser);
  }

  async findByUser(user: User): Promise<ConnectedUser[]> {
    return this.connectedUserRepository.find({
      relations: ['user'],
      where: { user: { id: user.id } },
    });
  }
}
