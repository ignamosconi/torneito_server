import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsObject, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';

export class StartMatchDto {
  @ApiProperty({
    description: 'Identificador único del partido en la plataforma como string (ej: "SERIE_BO3_IGNA_02")',
    example: 'SERIE_BO3_IGNA_02',
    minLength: 3,
    maxLength: 60,
  })
  @IsString()
  @MinLength(3)
  @MaxLength(60)
  matchId!: string;

  @ApiProperty({
    description: 'Puerto del servidor CS2 a levantar',
    example: 27016,
    minimum: 1024,
    maximum: 65535,
  })
  @IsNumber()
  @Min(1024)
  @Max(65535)
  port!: number;

  @ApiProperty({
    description: 'Objeto de configuración completo de MatchZy. Se envía tal cual a la API de MatchZy — ver documentación oficial del plugin.',
    example: {
      matchid: 777, //Numérico, no como el apartado matchId: string anterior
      num_maps: 1,
      maplist: ['de_nuke'],
      team1: {
        name: 'Fnatic',
        players: {
          '76561198252109564': 'Igna BO1',
          'steam64': 'Nombre en servidor (sobreescribe el nombre de steam, si se deja vacío toma nombre de Steam)'
        },
      },
      team2: {
        name: 'Noobs',
        players: {
          '76561198000000006': 'Rival1',
        },
      },
    },
  })
  @IsObject()
  config!: Record<string, any>;
}