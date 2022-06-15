import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConnectedUser } from 'src/typeorm/ConnectedUser';
import { ConnectedUserService } from './connected-user.service';

@Module({
  imports: [TypeOrmModule.forFeature([ConnectedUser])],
  providers: [ConnectedUserService],
  exports: [TypeOrmModule, ConnectedUserService],
})
export class ConnectedUserModule {}
