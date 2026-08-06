import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class StatusDto {
  @ApiProperty({
    description: 'Estado recibido.',
    example: 'success (para lifecycle/start-match)',
    minLength: 1,
    maxLength: 512,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(512)
  status!: string;

  @ApiPropertyOptional({
    description: 'Mensaje que describe el estado recibido.',
    example: 'Servidor inicializado y RCON en cola (para lifecycle/start-match)',
    minLength: 1,
    maxLength: 512,
  })
  @IsString()
  @IsOptional()
  @MinLength(1)
  @MaxLength(512)
  message?: string;
}