import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class EditarAdminDto {
  @ApiProperty({
    description: 'Nuevo nombre del admin. Sin espacios ni caracteres especiales: ( ) { } [ ]',
    example: 'NuevoNombre',
    minLength: 2,
    maxLength: 16,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(16)
  nombre!: string;
}