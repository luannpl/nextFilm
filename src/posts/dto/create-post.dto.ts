import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsOptional } from 'class-validator';

export class CreatePostDto {
  @IsNotEmpty({ message: 'O campo título é obrigatório' })
  titulo: string;

  @IsNotEmpty({ message: 'O campo descrição é obrigatório' })
  descricao: string;

  @IsNotEmpty({ message: 'O campo curtidas é obrigatório' })
  @Type(() => Number)
  curtidas: number;

  @IsNotEmpty({ message: 'O campo avaliação é obrigatório' })
  @Type(() => Number)
  avaliacao: number;

  @IsNotEmpty({ message: 'O campo filme_id é obrigatório' })
  filme_id: string;

  @IsNotEmpty({ message: 'O campo user_id é obrigatório' })
  user_id: string;
}
