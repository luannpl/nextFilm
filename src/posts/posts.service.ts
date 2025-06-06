import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Post } from './post.entity';
import { Repository } from 'typeorm';
import { User } from 'src/users/user.entity';
import { CreatePostDto } from './dto/create-post-dto';
import * as mime from 'mime-types';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class PostsService {
  private readonly logger = new Logger(PostsService.name);
  private supabase: SupabaseClient;

  constructor(
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY,
    );
  }

  async createPost(postData: CreatePostDto, image?: Express.Multer.File) {
    this.logger.log(`Creating new post...`);

    const { content, authorId } = postData;

    const user = await this.userRepository.findOne({
      where: { id: authorId },
    });

    let imagePath = null;

    if (image) {
      this.logger.log(`Image received, processing upload...`);
      const extension = mime.extension(image.mimetype);
      const pathName = `/posts/${uuidv4()}.${extension}`;

      const { error } = await this.supabase.storage
        .from('nextFilms')
        .upload(pathName, image.buffer, {
          contentType: image.mimetype,
          upsert: true,
        });

      if (error) {
        this.logger.error(`Error uploading image: ${error.message}`);
        throw new InternalServerErrorException('Error uploading image');
      }

      this.logger.log(`Image uploaded successfully.`);
      imagePath = pathName;
    } else {
      this.logger.log(`No image provided, skipping upload...`);
    }

    this.logger.log(`Creating post...`);

    const newPost = this.postRepository.create({
      content,
      user,
      likesCount: 0,
      imagePath,
    });

    const post = await this.postRepository.save(newPost);

    this.logger.log(`Post created successfully.`);

    return post;
  }

  async getPosts(page = 1, limit = 10, orderBy = 'createdAt') {
    const skip = (page - 1) * limit;
    const take = limit;
    const order = orderBy === 'createdAt' ? 'DESC' : 'ASC';
    const [posts, total] = await this.postRepository.findAndCount({
      skip,
      take,
      order: { [orderBy]: order },
      relations: ['user', 'likes'],
    });

    // Mapeia os posts para adicionar a signedUrl se houver imagem
    const postsWithSignedUrls = await Promise.all(
      posts.map(async (post) => {
        if (post.imagePath) {
          const { data, error } = await this.supabase.storage
            .from('nextFilms')
            .createSignedUrl(post.imagePath, 60 * 60); // 1 hora
          this.logger.log('Signed URL gerada com sucesso');
          delete post.imagePath;
          if (!error && data?.signedUrl) {
            return { ...post, imageUrl: data.signedUrl };
          }
        }
        delete post.imagePath;
        return { ...post, imageUrl: null };
      }),
    );

    const totalPages = Math.ceil(total / limit);

    return {
      posts: postsWithSignedUrls,
      hasNextPage: page < totalPages,
      totalPages,
      page,
      limit,
    };
  }

  async getPostById(id: number) {
    const post = await this.postRepository.findOne({
      where: { id },
      relations: ['comments', 'comments.user'],
    });

    if (!post) {
      throw new BadRequestException('Post not found');
    }

    return post;
  }

  async getPostsByUserId(userId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const take = limit;

    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['posts'],
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    const posts = user.posts.slice(skip, skip + take);

    // Mapeia os posts para adicionar a signedUrl se houver imagem
    const postsWithSignedUrls = await Promise.all(
      posts.map(async (post) => {
        if (post.imagePath) {
          const { data, error } = await this.supabase.storage
            .from('nextFilms')
            .createSignedUrl(post.imagePath, 60 * 60); // 1 hora
          this.logger.log('Signed URL gerada com sucesso');
          delete post.imagePath;
          if (!error && data?.signedUrl) {
            return { ...post, imageUrl: data.signedUrl };
          }
        }
        delete post.imagePath;
        return { ...post, imageUrl: null };
      }),
    );

    return {
      posts: postsWithSignedUrls,
      hasNextPage: user.posts.length > skip + take,
      totalPages: Math.ceil(user.posts.length / limit),
      page,
      limit,
    };
  }

  async deletePost(id: number) {
    const post = await this.postRepository.findOne({ where: { id } });

    if (!post) {
      throw new BadRequestException('Post not found');
    }

    if (post.imagePath) {
      const { error } = await this.supabase.storage
        .from('nextFilms')
        .remove([post.imagePath]);

      if (error) {
        this.logger.error(`Error removing image: ${error.message}`);
        throw new InternalServerErrorException('Error removing image');
      }
    }

    await this.postRepository.delete(id);
    this.logger.log(`Post with ID ${id} deleted successfully.`);
  }
}
