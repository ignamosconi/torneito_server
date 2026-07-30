import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RconModule } from './rcon/rcon.module';
import { AdminModule } from './admin/admin.module';
import { LifecycleModule } from './lifecycle/lifecycle.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env.${process.env.NODE_ENV || 'development'}`,
      validate: (config) => {
        if (!config.CS2_RCON_HOST || !config.CS2_RCON_PORT || !config.CS2_RCON_PASSWORD) {
          throw new Error('ERROR: Faltan variables de servidor en .env');
        }
        return config;
      },
    }),
    RconModule,
    AdminModule,
    LifecycleModule,
  ],
})
export class AppModule {}
