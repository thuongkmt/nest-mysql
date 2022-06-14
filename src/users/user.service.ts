import { Injectable } from '@nestjs/common';
import { User as UserEntity } from '../typeorm/User';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  findByUsername(id: number): Promise<UserEntity | null> {
    return this.userRepository.findOne({ id: id });
  }
}
