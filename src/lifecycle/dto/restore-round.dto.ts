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
    description: 'MatchID numérico interno para esta serie.',
    example: 777,
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  matchid!: number;

  @ApiProperty({
    description: 'Número de mapa a restaurar. 0 = Primer mapa, 1 = Segundo mapa, etc.',
    example: 2,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  @Max(4)
  mapNumber!: number;

  @ApiProperty({
    description: 'Número de ronda al que se quiere restaurar. 0 = Primera ronda, 1 = Segunda ronda, etc.',
    example: 5,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  roundNumber!: number;
}