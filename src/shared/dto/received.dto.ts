import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class ReceivedDto {
  @ApiProperty({
    description: 'Indica si el recurso fue recibido.',
    example: true,
    type: Boolean,
    required: true,
  })
  @IsBoolean({
    message: 'received debe ser un valor booleano.',
  })
  received!: boolean;
}