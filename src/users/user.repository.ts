import { EntityRepository, Repository } from 'typeorm';
import { User } from '../typeorm/User';

@EntityRepository(User)
export class UserRepository extends Repository<User> {
  getInactiveUsers(): Promise<User[]> {
    return this.createQueryBuilder()
      .where('token = :active', { active: 0 })
      .getMany();
  }
}
