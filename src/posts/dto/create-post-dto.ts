import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreatePostDto {
  @IsString({ message: 'Content must be a string.' })
  @IsNotEmpty({ message: 'Content is required.' })
  content: string;

  @IsOptional()
  image?: any; // o arquivo não é validado aqui, só no interceptor
}
