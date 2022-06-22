import { Injectable } from '@nestjs/common';
import { User as UserEntity } from '../typeorm/User';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IUser } from 'src/types/user.interface';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  async create(userEntity: IUser): Promise<IUser> {
    return this.userRepository.save(userEntity);
  }

  async findById(id: number): Promise<UserEntity | null> {
    return this.userRepository.findOne({ where: { id } });
  }

  async findByRootUserId(rootUserId: string): Promise<UserEntity | null> {
    return this.userRepository.findOne({ where: { rootUserId } });
  }
}
