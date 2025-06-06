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
} from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @UseInterceptors(
    FileInterceptor('image', {
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png)$/)) {
          return cb(new Error('Formato de imagem inválido'), false);
        }
        cb(null, true);
      },
    }),
  )
  create(
    @Body() createReviewDto: CreateReviewDto,
    @UploadedFile() image?: Express.Multer.File,
  ) {
    return this.reviewsService.createPost(createReviewDto, image);
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
