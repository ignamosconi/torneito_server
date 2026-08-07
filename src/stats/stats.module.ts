import { Module } from '@nestjs/common';
import { StatsService } from './services/stats.service';
import { StatsController } from './controllers/stats.controller';
import { STATS_SERVICE } from './stats.tokens';

@Module({
  controllers: [StatsController],
  providers: [{ provide: STATS_SERVICE, useClass: StatsService }],
})
export class StatsModule {}