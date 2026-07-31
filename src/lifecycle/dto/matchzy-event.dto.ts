import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Min, MinLength } from 'class-validator';

export class MatchZyEventDto {
  @ApiProperty({
    description: 'Nombre del evento enviado por MatchZy (ej: "series_end", "round_end", "round_started")',
    example: 'series_end',
  })
  @IsString()
  @MinLength(1)
  event!: string;

  @ApiProperty({
    description: 'MatchID numérico interno del partido',
    example: 555,
  })
  @IsNumber()
  @Min(1)
  matchid!: number;

  @ApiPropertyOptional({ description: 'Número de mapa dentro de la serie (0-indexed)', example: 0 })
  @IsNumber()
  @IsOptional()
  map_number?: number;

  @ApiPropertyOptional({ description: 'Nombre del mapa en juego', example: 'de_mirage' })
  @IsString()
  @IsOptional()
  map_name?: string;

  // Firma de índice para capturar cualquier propiedad dinámica adicional sin que ValidationPipe tire 400
  [key: string]: unknown;
}