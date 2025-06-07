import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';
import { IsOptional, IsString } from 'class-validator';

export class UpdateUserDto extends PartialType(CreateUserDto) {
    @IsOptional()
    @IsString({ message: 'O campo nome deve ser uma string' })
    bio?: string;

    @IsOptional()
    @IsString({ message: 'O campo cidade deve ser uma string' })
    cidade?: string;

    @IsOptional()
    avatar?: any; // o arquivo não é validado aqui, só no interceptor

}
