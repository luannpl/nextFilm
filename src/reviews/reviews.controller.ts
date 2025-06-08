import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { User } from 'src/decorators/user.decorator';
import { TokenPayload } from 'src/auth/auth';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() createReviewDto: CreateReviewDto, @User() user: TokenPayload) {
    const { sub } = user;
    return this.reviewsService.createReview(createReviewDto, sub);
  }

  @Get()
  findAll() {
    return this.reviewsService.findAllReviews();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.reviewsService.findOneReview(id);
  }

  @Get('movies/:id')
  findByMovie(@Param('id') id: string) {
    return this.reviewsService.findByMovie(id);
  }

  @Get('movies/:id/rating')
  findRatingByMovie(@Param('id') id: string) {
    return this.reviewsService.findRatingByMovie(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.reviewsService.remove(id);
  }
}
