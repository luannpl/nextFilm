import { IsNotEmpty, IsString } from 'class-validator';

export class CreatePostDto {
  @IsString({ message: 'Title must be a string.' })
  @IsNotEmpty({ message: 'Content is required.' })
  content: string;
}
