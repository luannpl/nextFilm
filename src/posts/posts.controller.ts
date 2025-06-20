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
import { JwtOptionalAuthGuard } from 'src/guards/jwt-optional-auth.guard';

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

  @UseGuards(JwtAuthGuard)
  @Post(':id/like')
  async toggleLike(@Param('id') id: number, @User() user: TokenPayload) {
    const { sub: userId } = user;
    return await this.postsService.toggleLike(id, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/comment')
  async addComment(
    @Param('id') id: number,
    @Body('content') content: string,
    @User() user: TokenPayload,
  ) {
    const { sub } = user;
    return await this.postsService.addComment(id, content, sub);
  }

  @Get()
  @UseGuards(JwtOptionalAuthGuard)
  async getPosts(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('orderBy') orderBy: string = 'createdAt',
    @User() user?: TokenPayload,
  ) {
    const userId = user?.sub; 
      
    return this.postsService.getPosts(+page, +limit, orderBy, userId);
  }

  @Get('/users/:userId')
  @UseGuards(JwtAuthGuard)
  async getPostsByLoggedUser(
    @Param('userId') userId: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    return await this.postsService.getPostsByUserId(userId, +page, +limit);
  }

  @Get(':id')
  async getPostById(@Param('id') id: string) {
    return await this.postsService.getPostById(+id);
  }

  @Get(':id/comments')
  async getCommentsByPostId(@Param('id') id: number) {
    return await this.postsService.getPostComments(id);
  }

  @HttpCode(204)
  @Delete(':id')
  async deletePost(@Param('id') id: number) {
    return await this.postsService.deletePost(id);
  }
}
