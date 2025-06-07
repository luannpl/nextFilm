import { Body, Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignInDto } from './dto/signIn.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { Request, Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async hello() {
    return 'Hello from the auth controller';
  }

  @Get('session')
  getSession(@Req() req: Request) {
    return this.authService.getSession(req);
  }

  @Post('signin')
  signIn(@Body() signInDto: SignInDto, @Res({ passthrough: true }) res: Response) {
    return this.authService.signIn(signInDto, res);
  }
}
