import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) { }

  @Post()
  @UseInterceptors(FileInterceptor('image', {
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
      if (!file.mimetype.match(/\/(jpg|jpeg|png)$/)) {
        return cb(new Error('Formato de imagem inválido'), false);
      }
      cb(null, true);
    }
  }))
  create(@Body() createPostDto: CreatePostDto, @UploadedFile() image?: Express.Multer.File) {
    return this.postsService.createPost(createPostDto, image);
  }

  @Get()
  findAll() {
    return this.postsService.findAllPosts();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.postsService.findOnePost(id);
  }

  @Get('movies/:id')
  findByMovie(@Param('id') id: string) {
    return this.postsService.findByMovie(id);
  }

  @Patch(':id/curtidas')
  updateCurtidas(@Param('id') id: string) {
    return this.postsService.updateCurtidas(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.postsService.remove(id);
  }
}
