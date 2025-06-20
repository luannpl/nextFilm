import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseClient, createClient } from '@supabase/supabase-js';
import { CreateReviewDto } from './dto/create-review.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
// import { Post } from './review.entity';
import * as dotenv from 'dotenv';
import * as mime from 'mime-types';
import { v4 as uuidv4 } from 'uuid';
import { Review } from './review.entity';
dotenv.config();
@Injectable()
export class ReviewsService {
  private readonly logger = new Logger(ReviewsService.name);
  private supabase: SupabaseClient;

  constructor(
    @InjectRepository(Review)
    private readonly reviewRepository: Repository<Review>,
  ) {
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY,
    );
  }

  async createReview(createReviewPost: CreateReviewDto, userId: string) {
    this.logger.log('userId', userId);
    this.logger.log('Creating review', createReviewPost);
    const review = await this.reviewRepository.save({
      ...createReviewPost,
      user: { id: userId },
    });

    return review;
  }

  async findAllReviews() {
    this.logger.log('Retrieving all reviews');
    const reviews = await this.reviewRepository.find({
      relations: ['user'],
      select: {
        user: {
          id: true,
          nome: true,
          sobrenome: true,
          email: false,
          senha: false,
        },
      },
    });

    // Mapeia os reviews para adicionar a signedUrl se houver imagem
    const reviewsWithSignedUrls = await Promise.all(
      reviews.map(async (review) => {
        if (review.caminho_imagem) {
          const { data, error } = await this.supabase.storage
            .from('nextfilms')
            .createSignedUrl(review.caminho_imagem, 60 * 60); // 1 hora
          this.logger.log('Signed URL gerada com sucesso');
          delete review.caminho_imagem;
          if (!error && data?.signedUrl) {
            return { ...review, imageUrl: data.signedUrl };
          }
        }

        return { ...review, imageUrl: null };
      }),
    );
    return reviewsWithSignedUrls;
  }

  async findOneReview(id: string) {
    this.logger.log(`Retrieving post with id: ${id}`);
    return await this.reviewRepository.findOne({ where: { id } });
  }

  async findByUser(userId: string) {
    const reviews = await this.reviewRepository.find({
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
      },
    });

    return reviews.map((review) => {
      const { senha, ...userWithoutPassword } = review.user;
      return {
        ...review,
        user: userWithoutPassword,
      };
    });
  }

  async findByMovie(movieId: string) {
    const reviews = await this.reviewRepository.find({
      where: { filme_id: movieId },
      relations: ['user'],
      select: {
        id: true,
        titulo: true,
        descricao: true,
        avaliacao: true,
        caminho_imagem: true,
        createdAt: true,
        user: {
          nome: true,
          sobrenome: true,
        },
      },
      order: {
        createdAt: 'DESC',
      }
    });

    // Mapeia os reviews para adicionar a signedUrl se houver imagem
    const reviewsWithSignedUrls = await Promise.all(
      reviews.map(async (review) => {
        if (review.caminho_imagem) {
          const { data, error } = await this.supabase.storage
            .from('nextfilms')
            .createSignedUrl(review.caminho_imagem, 60 * 60); // 1 hora
          this.logger.log('Signed URL gerada com sucesso', data);
          delete review.caminho_imagem;
          if (!error && data?.signedUrl) {
            return { ...review, imageUrl: data.signedUrl };
          }
        }

        return { ...review, imageUrl: null };
      }),
    );

    return reviewsWithSignedUrls;
  }

  async findRatingByMovie(movieId: string) {
    this.logger.log(`Retrieving reviews for movie with id: ${movieId}`);
    const reviews = await this.reviewRepository.find({
      where: { filme_id: movieId },
      select: {
        avaliacao: true,
      },
    });

    if (reviews.length === 0) {
      this.logger.warn(`No reviews found for movie with id: ${movieId}`);
      return {
        averageRating: 0,
        totalReviews: 0,
      }
    }

    const totalRating = reviews.reduce((sum, review) => sum + review.avaliacao, 0);
    const averageRating = totalRating / reviews.length;

    return {
      averageRating,
      totalReviews: reviews.length,
    };
  }

  async remove(id: string) {
    this.logger.log(`Removing review with id: ${id}`);
    return await this.reviewRepository.delete(id);
  }
}
