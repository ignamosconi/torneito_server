import type { Response } from 'express';
import { StartMatchDto } from '../dto/start-match.dto';
import { ServerReadyDto } from '../dto/server-ready.dto';
import { RestoreRoundDto } from '../dto/restore-round.dto';
import { MatchZyEventDto } from '../dto/matchzy-event.dto';
import { StatusDto } from 'src/shared/dto/status.dto';
import { ReceivedDto } from 'src/shared/dto/received.dto';

export interface ILifecycleController {
  startMatch(body: StartMatchDto): Promise<StatusDto>;
  getMatchConfig(matchId: string, res: Response): Promise<Response>;
  handleMatchEvents(eventData: MatchZyEventDto, authHeader: string): Promise<ReceivedDto>;
  handleServerReady(body: ServerReadyDto): Promise<StatusDto>;
  restoreRound(body: RestoreRoundDto): Promise<string>;
}