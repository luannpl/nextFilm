import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class SignInDto {
  @IsNotEmpty({ message: 'O campo email é obrigatório' })
  @IsEmail({}, { message: 'O campo email deve ser um email válido' })
  email: string;

  @IsNotEmpty({ message: 'O campo senha é obrigatório' })
  @IsString({ message: 'O campo senha deve ser uma string' })
  senha: string;
}
