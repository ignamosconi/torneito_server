import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';

export class SendCommandDto {
  @ApiProperty({
    description: 'Comando de consola CS2 a ejecutar vía RCON',
    example: 'mp_restartgame 1',
    minLength: 1,
    maxLength: 512,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(512)
  command!: string;

  @ApiPropertyOptional({
    description: 'Puerto del servidor CS2 destino. Si se omite, usa el puerto por defecto del .env (27015)',
    example: 27015,
    minimum: 1024,
    maximum: 65535,
  })
  @IsNumber()
  @IsOptional()
  @Min(1024)
  @Max(65535)
  port?: number;
}