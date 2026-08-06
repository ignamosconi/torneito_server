import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class EditarAdminDto {
  @ApiPropertyOptional({
    description: 'Nuevo SteamID64. Debe tener exactamente 17 dígitos y comenzar con 7656119',
    example: '76561198087654321',
  })
  @IsString()
  @IsOptional()
  @Matches(/^7656119\d{10}$/, { message: 'nuevoSteam64 debe ser un SteamID64 válido (17 dígitos, comenzando con 7656119)' })
  nuevoSteam64?: string;

  @ApiPropertyOptional({
    description: 'Nuevo nombre del admin. Sin espacios ni caracteres especiales: ( ) { } [ ]',
    example: 'NuevoNombre',
    minLength: 2,
    maxLength: 16,
  })
  @IsString()
  @IsOptional()
  @MinLength(2)
  @MaxLength(16)
  nuevoNombre?: string;
}