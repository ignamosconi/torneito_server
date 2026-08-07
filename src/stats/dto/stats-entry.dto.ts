import { ApiProperty } from '@nestjs/swagger';

//Una fila del CSV de MatchZy = un jugador en un mapa, con estas estadísticas:
export class StatsEntryDto {
  @ApiProperty({ example: 333 })
  matchid!: number;

  @ApiProperty({ example: 0 })
  mapnumber!: number;

  @ApiProperty({ example: '76561198252109564' })
  steamid64!: string;

  @ApiProperty({ example: 'Five Stack' })
  team!: string;

  @ApiProperty({ example: 'Igna BO3' })
  name!: string;

  @ApiProperty({ example: 2 })
  kills!: number;

  @ApiProperty({ example: 0 })
  deaths!: number;

  @ApiProperty({ example: 200 })
  damage!: number;

  @ApiProperty({ example: 0 })
  assists!: number;

  @ApiProperty({ example: 0 })
  enemy5ks!: number;

  @ApiProperty({ example: 0 })
  enemy4ks!: number;

  @ApiProperty({ example: 0 })
  enemy3ks!: number;

  @ApiProperty({ example: 1 })
  enemy2ks!: number;

  @ApiProperty({ example: 0 })
  utility_count!: number;

  @ApiProperty({ example: 0 })
  utility_damage!: number;

  @ApiProperty({ example: 0 })
  utility_successes!: number;

  @ApiProperty({ example: 0 })
  utility_enemies!: number;

  @ApiProperty({ example: 0 })
  flash_count!: number;

  @ApiProperty({ example: 0 })
  flash_successes!: number;

  @ApiProperty({ 
    description: 'Daño que te hicieron a lo largo de todas las rondas de este mapa.',
    example: 0 
  })
  health_points_removed_total!: number;

  @ApiProperty({ 
    description: 'Deprecated (usado en csgo, donde podías hacer 491 en 1, en cs2 hacés 100 en 1, no hay "extra"), usar damage directamente',
    example: 200 
  })
  health_points_dealt_total!: number;

  @ApiProperty({ example: 3 })
  shots_fired_total!: number;

  @ApiProperty({ example: 2 })
  shots_on_target_total!: number;

  @ApiProperty({ 
    description: 'Cantidad de veces que el jugador ESTUVO en un 1v1',
    example: 0 
  })
  v1_count!: number;

  @ApiProperty({ 
    description: 'Cantidad de veces que el jugador GANÓ un 1v1',
    example: 0 
  })
  v1_wins!: number;

  @ApiProperty({ 
    description: 'Cantidad de veces que el jugador ESTUVO en un 1v2',
    example: 0 
  })
  v2_count!: number;

  @ApiProperty({ 
    description: 'Cantidad de veces que el jugador GANÓ un 1v2',
    example: 0 
  })
  v2_wins!: number;

  @ApiProperty({ example: 1 })
  entry_count!: number;

  @ApiProperty({ example: 1 })
  entry_wins!: number;

  @ApiProperty({ example: 700 })
  equipment_value!: number;

  @ApiProperty({ example: 0 })
  money_saved!: number;

  @ApiProperty({ example: 600 })
  kill_reward!: number;

  @ApiProperty({ example: 0 })
  live_time!: number;

  @ApiProperty({ example: 2 })
  head_shot_kills!: number;

  @ApiProperty({ example: 39600 })
  cash_earned!: number;

  @ApiProperty({ example: 0 })
  enemies_flashed!: number;
}