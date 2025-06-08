import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Put,
  UseInterceptors,
  UseGuards,
  UploadedFile,
  ParseUUIDPipe,
  HttpCode,
  Req,
  HttpStatus,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ReviewsService } from 'src/reviews/reviews.service';
import { User } from 'src/decorators/user.decorator';
import { TokenPayload } from 'src/auth/auth';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { JwtOptionalAuthGuard } from 'src/guards/jwt-optional-auth.guard';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly reviewsService: ReviewsService,
  ) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.createUser(createUserDto);
  }

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @UseGuards(JwtOptionalAuthGuard)
  @Get(':userId')
  findOne(@Param('userId') userId: string, @User() user: TokenPayload) {
    const { sub: currentUserId } = user;
    return this.usersService.getUserById(userId, currentUserId);
  }

  @Get(':userId/posts')
  findPostsByUser(@Param('userId') userId: string) {
    return this.reviewsService.findByUser(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Put('profile')
  @UseInterceptors(
    FileInterceptor('avatar', {
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
  updateProfile(@User() user: TokenPayload, @Body() updateUserDto: UpdateUserDto, @UploadedFile() avatar?: Express.Multer.File) {
    const { sub } = user
    return this.usersService.updateProfile(sub, updateUserDto, avatar);
  }
  
  @UseGuards(JwtAuthGuard)
  @Post(':id/follow')
  followUser(
    @User() user: TokenPayload,
    @Param('id', ParseUUIDPipe) followingId: string,
  ) {
    const { sub: followerId }= user; // ID do usuário logado (do token JWT)
    return this.usersService.followUser(followerId, followingId);
  }

  /**
   * Endpoint para DEIXAR DE SEGUIR um usuário.
   * Ação requer que o usuário esteja autenticado.
   * DELETE /users/:id/unfollow
   */
  @UseGuards(JwtAuthGuard)
  @Delete(':id/unfollow')
  @HttpCode(HttpStatus.NO_CONTENT) // Retorna 204 No Content em caso de sucesso
  unfollowUser(
    @User() user: TokenPayload,
    @Param('id', ParseUUIDPipe) followingId: string,
  ) {
    const { sub: followerId } = user;
    return this.usersService.unfollowUser(followerId, followingId);
  }

  /**
   * Endpoint para LISTAR todos os usuários que um determinado usuário segue.
   * Rota pública.
   * GET /users/:id/following
   */
  @Get(':id/following')
  getFollowing(@Param('id', ParseUUIDPipe) userId: string) {
    return this.usersService.getFollowing(userId);
  }

  /**
   * Endpoint para LISTAR os seguidores de um determinado usuário.
   * Rota pública.
   * GET /users/:id/followers
   */
  @Get(':id/followers')
  getFollowers(@Param('id', ParseUUIDPipe) userId: string) {
    return this.usersService.getFollowers(userId);
  }
}
