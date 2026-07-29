import { Module } from '@nestjs/common';
import { Cs2Module } from './cs2/cs2.module';
import { ConfigModule } from '@nestjs/config';

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

    Cs2Module,  
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
