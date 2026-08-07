import { Module } from '@nestjs/common';
import { DemosService } from './services/demos.service';
import { DemosController } from './controllers/demos.controller';
import { DEMOS_SERVICE } from './demos.tokens';

@Module({
    controllers: [DemosController],
    providers: [
        { 
            provide: DEMOS_SERVICE, 
            useClass: DemosService 
        },
    ],
})
export class DemosModule {}