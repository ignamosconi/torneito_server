import { Module } from '@nestjs/common';
import { LifecycleService } from './services/lifecycle.service';
import { LifecycleController } from './controllers/lifecycle.controller';
import { RconModule } from '../rcon/rcon.module';
import { AdminModule } from '../admin/admin.module';

@Module({
  imports: [
    RconModule,   // Provee RconService
    AdminModule,  // Provee AdminService
  ],
  controllers: [LifecycleController],
  providers: [LifecycleService],
})
export class LifecycleModule {}