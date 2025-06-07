import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Post } from './post.entity';
import { In, Repository } from 'typeorm';
import { User } from 'src/users/user.entity';
import { CreatePostDto } from './dto/create-post-dto';
import * as mime from 'mime-types';
import { v4 as uuidv4 } from 'uuid';
import { Like } from 'src/likes/like.entity';
import { Comment } from 'src/comments/comment.entity';

@Injectable()
export class PostsService {
  private readonly logger = new Logger(PostsService.name);
  private supabase: SupabaseClient;

  constructor(
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(Like)
    private readonly likeRepository: Repository<Like>,

    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,
  ) {
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY,
    );
  }

  async createPost(
    postData: CreatePostDto,
    userId: string,
    image?: Express.Multer.File,
  ) {
    this.logger.log(`Creating new post...`);
    const { content } = postData;

    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    let imagePath = null;

    if (image) {
      this.logger.log(`Image received, processing upload...`);
      const extension = mime.extension(image.mimetype);
      const pathName = `/posts/${uuidv4()}.${extension}`;

      const { error } = await this.supabase.storage
        .from('nextfilms')
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

  async toggleLike(postId: number, userId: string) {
    this.logger.log(
      `Toggling like for post with ID ${postId} by user ${userId}...`,
    );

    const post = await this.postRepository.findOne({ where: { id: postId } });
    if (!post) {
      throw new BadRequestException('Post not found');
    }

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new BadRequestException('User not found');
    }

    const existingLike = await this.likeRepository.findOne({
      where: {
        post: { id: postId },
        user: { id: userId },
      },
      relations: ['post', 'user'],
    });

    if (existingLike) {
      await this.likeRepository.remove(existingLike);
      post.likesCount = Math.max(0, post.likesCount - 1);
      await this.postRepository.save(post);
      this.logger.log(`Removed like from post ID ${postId}`);
      return { liked: false, likesCount: post.likesCount };
    }

    const newLike = this.likeRepository.create({
      post: { id: postId } as Post,
      user: { id: userId } as User,
    });
    await this.likeRepository.save(newLike);

    post.likesCount += 1;
    await this.postRepository.save(post);
    this.logger.log(`Added like to post ID ${postId}`);
    return { liked: true, likesCount: post.likesCount };
  }

  async addComment(postId: number, content: string, userId: string) {
    this.logger.log(`Adding comment to post ID ${postId}...`);

    const post = await this.postRepository.findOne({
      where: { id: postId },
      relations: ['comments'],
    });

    if (!post) {
      throw new BadRequestException('Post not found');
    }

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new BadRequestException('User not found');
    }

    const comment = this.commentRepository.create({
      descricao: content,
      post,
      user,
    });
    const savedComment = await this.commentRepository.save(comment);
    return savedComment;
  }

  async getPosts(page = 1, limit = 10, orderBy = 'createdAt', userId?: string) {
    const skip = (page - 1) * limit;
    const take = limit;
    const order = orderBy === 'createdAt' ? 'DESC' : 'ASC';

    const [posts, total] = await this.postRepository.findAndCount({
      skip,
      take,
      order: { [orderBy]: order },
      relations: ['user', 'comments', 'likes.user'],
    });

    const postsWithSignedUrls = await Promise.all(
      posts.map(async (post) => {
        const postImageUrlPromise = post.imagePath
          ? this.supabase.storage
              .from('nextfilms')
              .createSignedUrl(post.imagePath, 3600)
          : Promise.resolve({ data: { signedUrl: null }, error: null });

        const userAvatarUrlPromise =
          post.user && post.user.avatar
            ? this.supabase.storage
                .from('nextfilms')
                .createSignedUrl(post.user.avatar, 3600)
            : Promise.resolve({ data: { signedUrl: null }, error: null });

        const [postImageResult, userAvatarResult] = await Promise.all([
          postImageUrlPromise,
          userAvatarUrlPromise,
        ]);

        if (postImageResult.error) {
          this.logger.error(
            `Error generating signed URL for post image ${post.imagePath}: ${postImageResult.error.message}`,
          );
        }
        if (userAvatarResult.error) {
          this.logger.error(
            `Error generating signed URL for user avatar ${post.user?.avatar}: ${userAvatarResult.error.message}`,
          );
        }

        const isLiked = userId
          ? post.likes.some((like) => like.user?.id === userId)
          : false;

        const userPayload = {
          id: post.user.id,
          nome: post.user.nome,
          sobrenome: post.user.sobrenome,
          usuario: post.user.usuario,
          avatar: userAvatarResult.data?.signedUrl || null,
        };

        delete post.imagePath;
        delete post.user;
        delete post.likes; // Remove o array de likes para não poluir a resposta da API

        return {
          ...post,
          imageUrl: postImageResult.data?.signedUrl || null,
          user: userPayload,
          isLiked, // Adiciona o novo campo
        };
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
      relations: ['comments'],
    });

    if (!post) {
      throw new BadRequestException('Post not found');
    }

    return post;
  }

  async getPostsByUserId(userId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [posts, totalCount] = await this.postRepository.findAndCount({
      where: { user: { id: userId } },
      relations: ['comments', 'user'],
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    const postsWithSignedUrls = await Promise.all(
      posts.map(async (post) => {
        if (post.imagePath) {
          const { data, error } = await this.supabase.storage
            .from('nextfilms')
            .createSignedUrl(post.imagePath, 60 * 60);
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
      hasNextPage: totalCount > skip + limit,
      totalPages: Math.ceil(totalCount / limit),
      page,
      limit,
    };
  }

  async getCommentsByPostId(postId: number) {
    const post = await this.postRepository.findOne({
      where: { id: postId },
      relations: ['comments', 'comments.user'],
    });

    if (!post) {
      throw new BadRequestException('Post not found');
    }

    // Remover o campo senha manualmente
    const commentsWithoutPassword = post.comments.map((comment) => {
      const { senha, email, ...safeUser } = comment.user || {};
      return {
        ...comment,
        user: safeUser,
      };
    });

    return commentsWithoutPassword;
  }

  async deletePost(id: number) {
    const post = await this.postRepository.findOne({ where: { id } });

    if (!post) {
      throw new BadRequestException('Post not found');
    }

    if (post.imagePath) {
      const { error } = await this.supabase.storage
        .from('nextfilms')
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
