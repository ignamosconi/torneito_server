import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';

export class ServerReadyDto {
  @ApiProperty({
    description: 'Identificador del partido para el que el servidor está listo',
    example: 'SERIE_BO3_IGNA_02',
    minLength: 3,
    maxLength: 60,
  })
  @IsString()
  @MinLength(3)
  @MaxLength(60)
  matchId!: string;

  @ApiProperty({
    description: 'Puerto en el que el servidor CS2 está escuchando',
    example: 27015,
    minimum: 1024,
    maximum: 65535,
  })
  @IsNumber()
  @Min(1024)
  @Max(65535)
  port!: number;
}