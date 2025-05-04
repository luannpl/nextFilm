import {
  ConflictException,
  forwardRef,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './user.entity';
import { Repository } from 'typeorm';
import { AuthService } from 'src/auth/auth.service';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @Inject(forwardRef(() => AuthService))
    private readonly authService: AuthService,
  ) {}

  async getUserByEmail(email: string) {
    this.logger.log(`Getting user with email: ${email}`);
    return this.userRepository.findOne({ where: { email } });
  }

  async createUser(body: CreateUserDto) {
    this.logger.log('Creating user', body);
    const existingUser = await this.getUserByEmail(body.email);
    if (existingUser) {
      this.logger.warn(`User with email ${body.email} already exists`);
      throw new ConflictException('User already exists');
    }

    const hashSenha = await this.authService.hashPassword(body.senha);
    this.logger.log('Senha hasheada');
    return this.userRepository.save({
      ...body,
      senha: hashSenha,
    });
  }

  async findAll() {
    const users = await this.userRepository.find();
    return {
      users: users.map((user) => {
        return {
          ...user,
          senha: undefined,
        };
      }),
    };
  }

  async findOne(id: string) {
    const user = await this.userRepository.findOne({ where: { id } });
    return {
      ...user,
      senha: undefined,
    };
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
