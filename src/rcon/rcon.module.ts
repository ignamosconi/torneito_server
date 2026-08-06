import { Module } from '@nestjs/common';
import { RconService } from './services/rcon.service';
import { RconController } from './controllers/rcon.controller';
import { RCON_SERVICE } from './rcon.tokens';

@Module({
  controllers: [RconController],
  providers: [
    { 
      provide: RCON_SERVICE, 
      useClass: RconService 
    },
  ],
  exports: [
    RCON_SERVICE,
  ],
})

export class RconModule {}