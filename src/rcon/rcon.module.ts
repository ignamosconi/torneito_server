import { Module } from '@nestjs/common';
import { RconService } from './services/rcon.service';
import { RconController } from './controllers/rcon.controller';

@Module({
  controllers: [RconController],
  providers: [RconService],
  exports: [RconService], // Lo importan lifecycle y admin
})
export class RconModule {}