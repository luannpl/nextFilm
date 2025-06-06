import { forwardRef, Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { AuthModule } from 'src/auth/auth.module';
import { ReviewsModule } from 'src/reviews/reviews.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]), // ⬅ necessário para o UserRepository funcionar
    forwardRef(() => AuthModule),
    ReviewsModule, // ⬅ necessário para injetar o AuthService
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
