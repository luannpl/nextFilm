import { Injectable, Logger, NotFoundException } from '@nestjs/common';
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

  async findByUser(userId: string) {
    const posts = await this.postRepository.find({
      where: {
        user: { id: userId },
      },
      relations: ['user'],
    });

    return posts.map((post) => {
      const { senha, ...userWithoutPassword } = post.user;
      return {
        ...post,
        user: userWithoutPassword,
      };
    });
  }

  async updateCurtidas(id: string) {
    const post = await this.postRepository.findOne({ where: { id } });
    if (!post) {
      throw new NotFoundException('Post não encontrado');
    }
    post.curtidas = post.curtidas ? post.curtidas + 1 : 1;
    return await this.postRepository.save(post);
  }

  async remove(id: string) {
    this.logger.log(`Removing post with id: ${id}`);
    return await this.postRepository.delete(id);
  }
}
