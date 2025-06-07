import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  UploadedFile,
  UseGuards,
} from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { FileInterceptor } from '@nestjs/platform-express';
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

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.reviewsService.remove(id);
  }
}
