import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post-dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { User } from 'src/decorators/user.decorator';
import { TokenPayload } from 'src/auth/auth';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  @UseInterceptors(
    FileInterceptor('image', {
      limits: {
        fileSize: 5 * 1024 * 1024, // 5 MB
      },
      fileFilter: (
        _: any,
        file: { mimetype: string },
        cb: (arg0: Error, arg1: boolean) => void,
      ) => {
        const allowedMimeTypes = ['image/jpg', 'image/jpeg', 'image/png'];
        if (allowedMimeTypes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new Error('Invalid file type'), false);
        }
      },
    }),
  )
  async createPost(
    @Body() postData: CreatePostDto,
    @User() user: TokenPayload,
    @UploadedFile() image?: Express.Multer.File,
  ) {
    const { sub } = user;
    return await this.postsService.createPost(postData, sub, image);
  }

  @Post(':id/like')
  async toggleLike(@Param('id') id: number, @Body('userId') userId: string) {
    return await this.postsService.toggleLike(id, userId);
  }

  @Get()
  async getPosts(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('orderBy') orderBy: string = 'createdAt',
  ) {
    return await this.postsService.getPosts(+page, +limit, orderBy);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getPostsByLoggedUser(
    @User() user: TokenPayload,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    const userId = user.sub;
    return await this.postsService.getPostsByUserId(userId, +page, +limit);
  }

  @Get(':id')
  async getPostById(@Param('id') id: string) {
    return await this.postsService.getPostById(+id);
  }

  @HttpCode(204)
  @Delete(':id')
  async deletePost(@Param('id') id: number) {
    return await this.postsService.deletePost(id);
  }
}
