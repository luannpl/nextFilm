import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { SupabaseClient, createClient } from '@supabase/supabase-js'
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post } from './post.entity';
import * as dotenv from 'dotenv';
import * as mime from 'mime-types';
import { v4 as uuidv4 } from 'uuid';
dotenv.config();
@Injectable()
export class PostsService {
  private readonly logger = new Logger(PostsService.name);
  private supabase: SupabaseClient;

  constructor(
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
  ) {
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY,
    )
  }

  async createPost(createPostDto: CreatePostDto, image: Express.Multer.File) {
    this.logger.log('Iniciando criação do post');

    let caminho_imagem = null;
    if (image) {
      this.logger.log('Imagem recebida, processando upload...');
      const extension = mime.extension(image.mimetype);
      const path_name = `posts/${uuidv4()}.${extension}`;
      this.logger.log(`Gerado caminho para imagem: ${path_name}`);

      const { error } = await this.supabase.storage.from('nextfilms').upload(path_name, image.buffer, {
        contentType: image.mimetype,
        upsert: false,
      });

      if (error) {
        this.logger.error('Erro ao fazer upload da imagem', error);
        throw new InternalServerErrorException('Erro ao fazer upload da imagem');
      }

      this.logger.log('Upload da imagem concluído com sucesso');
      caminho_imagem = path_name;
    } else {
      this.logger.log('Nenhuma imagem foi enviada');
    }

    this.logger.log('Salvando post no banco de dados...');
    const post = await this.postRepository.save({
      ...createPostDto,
      caminho_imagem,
      user: { id: createPostDto.user_id },
    });

    this.logger.log('Post criado com sucesso', post);
    return post;
  }

  async findAllPosts() {
    this.logger.log('Retrieving all posts');
    const posts = await this.postRepository.find({
      relations: ['user'],
      select: {
        user: {
          id: true,
          nome: true,
          sobrenome: true,
          email: false,
          senha: false,
        }
      }
    })
    
    // Mapeia os posts para adicionar a signedUrl se houver imagem
    const postsWithSignedUrls = await Promise.all(
      posts.map(async (post) => {
        if (post.caminho_imagem) {
          const { data, error } = await this.supabase
            .storage
            .from('nextfilms')
            .createSignedUrl(post.caminho_imagem, 60 * 60); // 1 hora
          this.logger.log('Signed URL gerada com sucesso');
          delete post.caminho_imagem;
          if (!error && data?.signedUrl) {
            return { ...post, imageUrl: data.signedUrl };
          }
        }

        return { ...post, imageUrl: null };
      })
    );
    return postsWithSignedUrls;
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
      select: {
        user: {
          id: true,
          nome: true,
          email: true,
          senha: false,
        },
      }
    });

    return posts.map((post) => {
      const { senha, ...userWithoutPassword } = post.user;
      return {
        ...post,
        user: userWithoutPassword,
      };
    });
  }

  async findByMovie(movieId: string) {
    const posts = await this.postRepository.find({
      where: { filme_id: movieId },
      relations: ['user'],
      select: {
        id: true,
        titulo: true,
        descricao: true,
        curtidas: true,
        avaliacao: true,  
        caminho_imagem: true,
        createdAt: true,
        user: {
          nome: true,
          sobrenome: true,
        }
      },
    });

    // Mapeia os posts para adicionar a signedUrl se houver imagem
    const postsWithSignedUrls = await Promise.all(
      posts.map(async (post) => {
        if (post.caminho_imagem) {
          const { data, error } = await this.supabase
            .storage
            .from('nextfilms')
            .createSignedUrl(post.caminho_imagem, 60 * 60); // 1 hora
          this.logger.log('Signed URL gerada com sucesso', data);
          delete post.caminho_imagem;
          if (!error && data?.signedUrl) {
            return { ...post, imageUrl: data.signedUrl };
          }
        }

        return { ...post, imageUrl: null };
      })
    );

    return postsWithSignedUrls;
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
