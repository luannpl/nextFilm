import { Type } from 'class-transformer';
import { IsNotEmpty } from 'class-validator';

export class CreateReviewDto {
  @IsNotEmpty({ message: 'O campo título é obrigatório' })
  titulo: string;

  @IsNotEmpty({ message: 'O campo descrição é obrigatório' })
  descricao: string;

  @IsNotEmpty({ message: 'O campo avaliação é obrigatório' })
  @Type(() => Number)
  avaliacao: number;

  @IsNotEmpty({ message: 'O campo filme_id é obrigatório' })
  filme_id: string;

  @IsNotEmpty({ message: 'O campo user_id é obrigatório' })
  user_id: string;
}
