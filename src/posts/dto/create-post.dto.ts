import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreatePostDto {
  @IsNotEmpty({ message: 'O campo título é obrigatório' })
  titulo: string;

  @IsNotEmpty({ message: 'O campo descrição é obrigatório' })
  descricao: string;

  @IsNotEmpty({ message: 'O campo curtidas é obrigatório' })
  @IsNumber({}, { message: 'O campo curtidas deve ser um número' })
  curtidas: number;

  @IsOptional()
  @IsString({ message: 'O campo imagem deve ser uma string' })
  imagem?: string;

  @IsNotEmpty({ message: 'O campo avaliação é obrigatório' })
  avaliacao: string;

  @IsNotEmpty({ message: 'O campo filme_id é obrigatório' })
  filme_id: string;

  @IsNotEmpty({ message: 'O campo user_id é obrigatório' })
  user_id: string;
}
