import { Module } from '@nestjs/common';
import { LifecycleService } from './services/lifecycle.service';
import { LifecycleController } from './controllers/lifecycle.controller';
import { RconModule } from '../rcon/rcon.module';
import { AdminModule } from '../admin/admin.module';
import { LIFECYCLE_SERVICE } from './lifecycle.tokens';

@Module({
  imports: [
    RconModule, 
    AdminModule,
  ],

  controllers: [
    LifecycleController,
  ],

  providers: [
    { 
      provide: LIFECYCLE_SERVICE,
      useClass: LifecycleService
    },
  ],
  
})
export class LifecycleModule {}