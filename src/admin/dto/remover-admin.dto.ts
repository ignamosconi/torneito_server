/*
Este DTO no va en el @Body sino que documenta el @Param. Lo usamos solo para Swagger; 
el param se recibe como string directo. Lo creamos igual para mantener consistencia y 
poder validarlo con un ParseSteamId64Pipe en un futuro
*/

import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches } from 'class-validator';

export class RemoverAdminDto {
  @ApiProperty({
    description: 'SteamID64 del admin a remover',
    example: '76561198012345678',
  })
  @IsString()
  @Matches(/^7656119\d{10}$/, { message: 'steam64 debe ser un SteamID64 válido' })
  steam64!: string;
}