import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsObject, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';

export class StartMatchDto {
  @ApiProperty({
    description: 'Identificador único del partido en la plataforma (ej: "SERIE_BO3_IGNA_02")',
    example: 'SERIE_BO3_IGNA_02',
    minLength: 3,
    maxLength: 60,
  })
  @IsString()
  @MinLength(3)
  @MaxLength(60)
  matchId!: string;

  @ApiProperty({
    description: 'Objeto de configuración completo de MatchZy (equipos, mapas, formato, etc.)',
    example: { matchid: 8093, num_maps: 3, players_per_team: 5 },
  })
  @IsObject()
  config!: Record<string, any>;

  @ApiProperty({
    description: 'Puerto del servidor CS2 a levantar',
    example: 27016,
    minimum: 1024,
    maximum: 65535,
  })
  @IsNumber()
  @Min(1024)
  @Max(65535)
  port!: number;
}