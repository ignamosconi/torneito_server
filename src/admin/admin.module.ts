import { Module } from '@nestjs/common';
import { AdminService } from './services/admin.service';
import { AdminController } from './controllers/admin.controller';
import { ADMIN_SERVICE } from './admin.tokens';

@Module({
  controllers: [AdminController],
  providers: [
    { 
      provide: ADMIN_SERVICE,
      useClass: AdminService 
    },
  ],
  exports: [
    ADMIN_SERVICE,
  ],
})
export class AdminModule {}