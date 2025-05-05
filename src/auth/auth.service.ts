import {
  forwardRef,
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { UsersService } from 'src/users/users.service';
import { SignInDto } from './dto/signIn.dto';
import { JwtService } from '@nestjs/jwt';
import { Response } from 'express';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  constructor(
    @Inject(forwardRef(() => UsersService))
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) { }

  async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  }

  async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  async signIn(body: SignInDto, res: Response) {
    const user = await this.usersService.getUserByEmail(body.email);
    if (!user) {
      this.logger.warn(`User with email ${body.email} not found`);
      throw new UnauthorizedException('Invalid credentials');
    }
    const isPasswordValid = await this.comparePassword(body.senha, user.senha);
    if (!isPasswordValid) {
      this.logger.warn(`Invalid password for user with email ${body.email}`);
      throw new UnauthorizedException('Invalid credentials');
    }
    delete user.senha
    
    const payload = { email: user.email, sub: user.id };
    const token = this.jwtService.sign(payload);
    this.logger.log(`User ${user.email} signed in successfully`);
    
    res.cookie('nextfilm_access_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    return { message: 'Login successful' }
  }
}
