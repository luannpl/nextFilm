import { Injectable, Logger } from '@nestjs/common';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post } from './post.entity';

@Injectable()
export class PostsService {
  private readonly logger = new Logger(PostsService.name);
  constructor(
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
  ) {}

  async createPost(createPostDto: CreatePostDto) {
    this.logger.log('Creating post', createPostDto);
    return await this.postRepository.save({
      ...createPostDto,
      user: { id: createPostDto.user_id },
    });
  }

  async findAllPosts() {
    this.logger.log('Retrieving all posts');
    return await this.postRepository.find();
  }

  async findOnePost(id: string) {
    this.logger.log(`Retrieving post with id: ${id}`);
    return await this.postRepository.findOne({ where: { id } });
  }

  async findPostsByUserId(userId: string) {
    this.logger.log(`Retrieving posts for user with id: ${userId}`);
    return await this.postRepository.find({ where: { user: { id: userId } } });
  }

  remove(id: number) {
    return `This action removes a #${id} post`;
  }
}
