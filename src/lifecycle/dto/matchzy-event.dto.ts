import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsOptional, IsString, Min, MinLength } from 'class-validator';

/**
 * DTO base del webhook de MatchZy.
 *
 * Todos los eventos comparten `event` y `matchid`. El resto de los campos
 * son opcionales porque cada evento tiene su propio schema:
 *   - round_started  → team1_score, team2_score, round_number, map_number
 *   - round_end      → reason, winner, team1, team2, round_time, ...
 *   - series_end     → time_until_restore, winner, team1_series_score, ...
 *   - demo_recording_stop → filename, map_number
 *   - player_ready   → player, team, ready_count_team1, ...
 *   - etc.
 *
 * Los campos extra que MatchZy envíe y no estén declarados aquí
 * son eliminados por el whitelist del ValidationPipe local de este endpoint.
 * El servicio que consuma este DTO puede acceder a todos los campos
 * mediante el objeto raw si necesita los datos completos.
 */
export class MatchZyEventDto {
  @ApiProperty({
    description: 'Nombre del evento enviado por MatchZy',
    example: 'round_started',
    minLength: 1,
  })
  @IsString()
  @MinLength(1)
  event!: string;

  @ApiProperty({
    description: 'MatchID numérico interno generado por MatchZy',
    example: 777,
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  matchid!: number;

  // ─── Campos opcionales comunes entre varios eventos ──────────────────────────

  @ApiPropertyOptional({ description: 'Número de mapa dentro de la serie (0-indexed)', example: 0 })
  @IsNumber()
  @IsOptional()
  map_number?: number;

  @ApiPropertyOptional(
    { description: 'Equipo ganador. En knife_round, el formato es "winner": "team1", pero en round_end, map_result, series_end es el example', 
      example: 
      { 
        side: '3', 
        team: 'team1',
      } 
    }
  )
  @IsOptional()
  winner?: any;

  @ApiPropertyOptional({ description: 'Nombre del archivo de demo (presente en demo_recording_start / stop)', example: '2026-06-08_12-00-00_777_de_dust2.dem' })
  @IsString()
  @IsOptional()
  filename?: string;

  // ─── round_started ───────────────────────────────────────────────────────────

  @ApiPropertyOptional({ description: 'Puntaje actual del equipo 1', example: 0 })
  @IsNumber()
  @IsOptional()
  team1_score?: number;

  @ApiPropertyOptional({ description: 'Puntaje actual del equipo 2', example: 0 })
  @IsNumber()
  @IsOptional()
  team2_score?: number;

  @ApiPropertyOptional({ description: 'Número de ronda actual', example: 1 })
  @IsNumber()
  @IsOptional()
  round_number?: number;

  // ─── round_end ───────────────────────────────────────────────────────────────

  @ApiPropertyOptional({ description: 'Razón de fin de ronda (enum de CS2: 1=tiempo, 7=defuse, 8=T eliminados, 9=CT eliminados, 12=bomba)', example: 8 })
  @IsNumber()
  @IsOptional()
  reason?: number;

  @ApiPropertyOptional({ 
    description: 'Datos del equipo 1. Presente en series_start (id, name) y round_end (score, players, stats)', 
    example: { id: '', name: 'Five Stack' } 
  })
  @IsOptional()
  team1?: any;


  @ApiPropertyOptional({ 
    description: 'Datos del equipo 2. Presente en series_start (id, name) y round_end (score, players, stats)', 
    example: { id: '', name: 'Noobs' } 
  })
  @IsOptional()
  team2?: any;

  @ApiPropertyOptional({ description: 'Duración de la ronda en segundos', example: 45 })
  @IsNumber()
  @IsOptional()
  round_time?: number;

  // ─── side_swap / halftime_started ────────────────────────────────────────────

  @ApiPropertyOptional({ description: 'Lado del equipo 1 tras el cambio', example: 'TERRORIST' })
  @IsString()
  @IsOptional()
  team1_side?: string;

  @ApiPropertyOptional({ description: 'Lado del equipo 2 tras el cambio', example: 'CT' })
  @IsString()
  @IsOptional()
  team2_side?: string;

  // ─── series_start ────────────────────────────────────────────────────────────

  @ApiPropertyOptional({ description: 'Número de mapas de la serie', example: 3 })
  @IsNumber()
  @IsOptional()
  num_maps?: number;

  // ─── series_end ──────────────────────────────────────────────────────────────

  @ApiPropertyOptional({ description: 'Segundos hasta restaurar el servidor tras la serie', example: 10 })
  @IsNumber()
  @IsOptional()
  time_until_restore?: number;

  @ApiPropertyOptional({ description: 'Puntaje de serie del equipo 1', example: 2 })
  @IsNumber()
  @IsOptional()
  team1_series_score?: number;

  @ApiPropertyOptional({ description: 'Puntaje de serie del equipo 2', example: 0 })
  @IsNumber()
  @IsOptional()
  team2_series_score?: number;

  // ─── player_ready / player_disconnect ────────────────────────────────────────

  @ApiPropertyOptional({ description: 'Datos del jugador que disparó el evento', example: { steamid: '76561198252109564', name: 'Igna', team: 'Five Stack' } })
  @IsOptional()
  player?: any;

  @ApiPropertyOptional({ description: 'Nombre del equipo al que pertenece el jugador', example: 'Five Stack' })
  @IsString()
  @IsOptional()
  team?: string;

  @ApiPropertyOptional({ description: 'Cantidad de jugadores listos en el equipo 1', example: 1 })
  @IsNumber()
  @IsOptional()
  ready_count_team1?: number;

  @ApiPropertyOptional({ description: 'Cantidad de jugadores listos en el equipo 2', example: 0 })
  @IsNumber()
  @IsOptional()
  ready_count_team2?: number;

  @ApiPropertyOptional({ description: 'Total de jugadores que pusieron .ready', example: 1 })
  @IsNumber()
  @IsOptional()
  total_ready?: number;

  @ApiPropertyOptional({ description: 'Total esperado de jugadores para iniciar', example: 10 })
  @IsNumber()
  @IsOptional()
  expected_total?: number;

  // ─── match_paused ────────────────────────────────────────────────────────────

  @ApiPropertyOptional({ description: 'Jugador que pausó el partido', example: { steamid: '76561198252109564', name: 'Igna', team: 'Five Stack' } })
  @IsOptional()
  paused_by?: any;

  @ApiPropertyOptional({ description: 'Indica si es una pausa táctica', example: false })
  @IsOptional()
  @IsBoolean()
  is_tactical?: boolean;

  @ApiPropertyOptional({ description: 'Indica si la pausa fue realizada por un admin', example: false })
  @IsOptional()
  @IsBoolean()
  is_admin?: boolean;

  @ApiPropertyOptional({ description: 'Timestamp unix de la pausa', example: 1780949857 })
  @IsNumber()
  @IsOptional()
  pause_time?: number;

  // ─── match_unpaused ──────────────────────────────────────────────────────────

  @ApiPropertyOptional({ description: 'Duración de la pausa en segundos', example: 118 })
  @IsNumber()
  @IsOptional()
  pause_duration?: number;
}