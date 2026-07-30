import type { Response } from 'express';
import { StartMatchDto } from '../dto/start-match.dto';
import { ServerReadyDto } from '../dto/server-ready.dto';
import { RestoreRoundDto } from '../dto/restore-round.dto';
import { MatchZyEventDto } from '../dto/matchzy-event.dto';

export interface ILifecycleController {
  startMatch(body: StartMatchDto): Promise<{ status: string; message: string }>;
  getMatchConfig(matchId: string, res: Response): Promise<Response>;
  handleMatchEvents(eventData: MatchZyEventDto, authHeader: string): Promise<{ received: boolean }>;
  handleServerReady(body: ServerReadyDto): Promise<{ status: string }>;
  restoreRound(body: RestoreRoundDto): Promise<string>;
}