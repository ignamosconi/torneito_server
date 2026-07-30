import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class AgregarAdminDto {
  @ApiProperty({
    description: 'SteamID64 del jugador. Debe tener exactamente 17 dígitos y comenzar con 7656119',
    example: '76561198012345678',
  })
  @IsString()
  @Matches(/^7656119\d{10}$/, { message: 'steam64 debe ser un SteamID64 válido (17 dígitos, comenzando con 7656119)' })
  steam64!: string;

  @ApiProperty({
    description: 'Nombre del admin. Sin espacios ni caracteres especiales: ( ) { } [ ]',
    example: 'Ignacio',
    minLength: 2,
    maxLength: 16,
  })
  @IsString()
  @MinLength(2)
  @MaxLength(16)
  nombre!: string;
}