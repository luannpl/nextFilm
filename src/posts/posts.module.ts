import { Module } from '@nestjs/common';
import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Post } from './post.entity';
import { User } from 'src/users/user.entity';
import { Like } from 'src/likes/like.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Post, User, Like])],
  controllers: [PostsController],
  providers: [PostsService],
  exports: [PostsService], // Exportando o serviço para ser utilizado em outros módulos
})
export class PostsModule {}
