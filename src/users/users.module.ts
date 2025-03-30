import { Module } from '@nestjs/common';
import { FilesModule } from 'src/files/files.module';

import { UsersController } from './controllers/users.controller';
import { UsersService } from './services/users.service';

@Module({
  controllers: [UsersController],
  exports: [UsersService],
  imports: [FilesModule],
  providers: [UsersService],
})
export class UsersModule {}
