import { Module } from '@nestjs/common';
import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Post } from './post.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Post])], // ⬅ necessário para o PostRepository funcionar
  controllers: [PostsController],
  providers: [PostsService],
})
export class PostsModule {}
