import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Max, Min } from 'class-validator';

export class RestoreRoundDto {
  @ApiProperty({
    description: 'Puerto del servidor CS2 donde se restaurará la ronda',
    example: 27015,
    minimum: 1024,
    maximum: 65535,
  })
  @IsNumber()
  @Min(1024)
  @Max(65535)
  port!: number;

  @ApiProperty({
    description: 'MatchID numérico interno de MatchZy (ej: 8093)',
    example: 8093,
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  matchid!: number;

  @ApiProperty({
    description: 'Número de ronda al que se quiere restaurar',
    example: 5,
    minimum: 0,
    maximum: 30,
  })
  @IsNumber()
  @Min(0)
  @Max(30)
  roundNumber!: number;
}