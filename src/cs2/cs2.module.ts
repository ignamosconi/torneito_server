//ARCHIVO: cs2.module.ts

import { Module } from '@nestjs/common';
import { Cs2Controller } from './controllers/cs2.rcon.controller';
import { Cs2RconService } from './services/cs2.rcon.service';
import { Cs2LifecycleService } from './services/cs2.lifecycle.service';
import { Cs2AdminService } from './services/cs2.admin.service';

@Module({
  controllers: [Cs2Controller],
  providers: [
    Cs2RconService,
    Cs2LifecycleService,
    Cs2AdminService,
  ],
  exports: [Cs2RconService], 
})
export class Cs2Module {}