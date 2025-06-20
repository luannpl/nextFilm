import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Comment } from './comment.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Comment])],
  exports: [TypeOrmModule.forFeature([Comment])],
})
export class CommentsModule {}
