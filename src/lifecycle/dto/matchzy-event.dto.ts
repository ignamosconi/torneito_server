import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, MaxLength, Min, MinLength } from 'class-validator';

export class MatchZyEventDto {
  @ApiProperty({
    description: 'Nombre del evento enviado por MatchZy (ej: "series_end", "demo_recording_stop")',
    example: 'series_end',
    minLength: 1,
    maxLength: 60,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  event!: string;

  @ApiProperty({
    description: 'MatchID numérico interno generado por MatchZy',
    example: 8093,
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  matchid!: number;

  @ApiPropertyOptional({ description: 'Nombre del mapa en juego', example: 'de_mirage' })
  @IsString()
  @IsOptional()
  @MaxLength(40)
  map_name?: string;

  @ApiPropertyOptional({ description: 'Número de mapa dentro de la serie (0-indexed)', example: 0 })
  @IsNumber()
  @IsOptional()
  map_number?: number;

  @ApiPropertyOptional({ description: 'Equipo ganador del mapa o la serie', example: 'team1' })
  @IsString()
  @IsOptional()
  @MaxLength(40)
  winner?: string;
}