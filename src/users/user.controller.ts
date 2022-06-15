import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { User } from 'src/typeorm/User';
import { UserService } from './user.service';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}
  @Get(':id')
  getInactiveUser(@Param('id', ParseIntPipe) id: number): Promise<User> {
    console.log(`id: ${id}`);
    return this.userService.findById(id);
  }
}
