import { IsEmail, IsNotEmpty, IsString } from "class-validator";

export class CreateUserDto {
    @IsNotEmpty({ message: 'O campo nome é obrigatório' })
    @IsString({ message: 'O campo nome deve ser uma string' })
    nome: string;

    @IsNotEmpty({ message: 'O campo sobrenome é obrigatório' })
    @IsString({ message: 'O campo sobrenome deve ser uma string' })
    sobrenome: string;
    
    @IsNotEmpty({ message: 'O campo username é obrigatório' })
    @IsString({ message: 'O campo username deve ser uma string' })
    usuario: string;

    @IsNotEmpty({ message: 'O campo email é obrigatório' })
    @IsEmail({}, { message: 'O campo email deve ser um email válido' })
    email: string;

    @IsNotEmpty({ message: 'O campo senha é obrigatório' })
    @IsString({ message: 'O campo senha deve ser uma string' })
    senha: string;

}
