import {
  ConflictException,
  forwardRef,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './user.entity';
import { Repository } from 'typeorm';
import { AuthService } from 'src/auth/auth.service';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as mime from 'mime-types';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);
  private supabase: SupabaseClient;
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @Inject(forwardRef(() => AuthService))
    private readonly authService: AuthService,
  ) {
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY,
    );
  }

  async getUserById(id: string) {
    this.logger.log(`Getting user with id: ${id}`);
    const user = await this.userRepository.findOne({
      where: { id },
      select: {
        id: true,
        nome: true,
        sobrenome: true,
        usuario: true,
        email: true,
        avatar: true,
        bio: true,
        cidade: true,
        createdAt: true
      }
    });

    if (!user) {
      this.logger.warn(`User with id ${id} not found`);
      throw new NotFoundException(`Usuário com id ${id} não encontrado`);
    }

    if (user.avatar) {
      this.logger.log(`Generating signed URL for avatar: ${user.avatar}`);

      const { data, error } = await this.supabase.storage
        .from('nextfilms') // Certifique-se que este é o nome correto do seu bucket
        .createSignedUrl(user.avatar, 60 * 60); // URL válida por 1 hora

      if (error) {
        this.logger.error(`Error generating signed URL for avatar ${user.avatar}: ${error.message}`);
        user.avatar = null;
      } else {
        this.logger.log('Signed URL for avatar generated successfully.');
        user.avatar = data.signedUrl;
      }
    }
    return user;
  }

  async getUserByEmail(email: string) {
    this.logger.log(`Getting user with email: ${email}`);
    return this.userRepository.findOne({ where: { email } });
  }

  async getUserByUsername(usuario: string) {
    this.logger.log(`Getting user with username: ${usuario}`);
    return this.userRepository.findOne({ where: { usuario } });
  }

  async createUser(body: CreateUserDto) {
    this.logger.log('Creating user', body);
    const existingUserWithEmail = await this.getUserByEmail(body.email);
    if (existingUserWithEmail) {
      this.logger.warn(`User with email ${body.email} already exists`);
      throw new ConflictException('Email já cadastrado');
    }
    const existingUserWithUsername = await this.getUserByUsername(
      body.usuario,
    );
    if (existingUserWithUsername) {
      this.logger.warn(`User with username ${body.usuario} already exists`);
      throw new ConflictException('Nome de usuário já cadastrado');
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

  async updateProfile(id: string, updateUserDto: UpdateUserDto, avatar?: Express.Multer.File) {
    this.logger.log(`Updating user profile with id: ${id}`, updateUserDto);
    const user = await this.getUserById(id);

    if (updateUserDto.email) {
      const existingUserWithEmail = await this.getUserByEmail(updateUserDto.email);
      if (existingUserWithEmail && existingUserWithEmail.id !== user.id) {
        this.logger.warn(`Email ${updateUserDto.email} already in use`);
        throw new ConflictException('Email já cadastrado');
      }
    }

    if (updateUserDto.usuario) {
      const existingUserWithUsername = await this.getUserByUsername(updateUserDto.usuario);
      if (existingUserWithUsername && existingUserWithUsername.id !== user.id) {
        this.logger.warn(`Username ${updateUserDto.usuario} already in use`);
        throw new ConflictException('Nome de usuário já cadastrado');
      }
    }

    let avatarPath = user.avatar;

    if (avatar) {
      this.logger.log(`New avatar received for user ${id}, processing upload to Supabase...`);

      const extension = mime.extension(avatar.mimetype);
      const pathName = `/avatars/${uuidv4()}.${extension}`;

      const { error } = await this.supabase.storage
        .from('nextfilms') // Usando o mesmo bucket 'nextfilms'
        .upload(pathName, avatar.buffer, {
          contentType: avatar.mimetype,
          upsert: true, // `upsert: true` pode ser útil para substituir se o caminho já existir
        });

      if (error) {
        this.logger.error(`Error uploading avatar for user ${id}: ${error.message}`);
        throw new InternalServerErrorException('Erro ao fazer upload da imagem do avatar.');
      }

      this.logger.log(`Avatar for user ${id} uploaded successfully to ${pathName}.`);
      avatarPath = pathName;
    } else {
      this.logger.log(`No new avatar provided for user ${id}, skipping upload.`);
    }

    const updatedData = {
      ...user,
      ...updateUserDto,
      avatar: avatarPath,
    };

    return this.userRepository.save(updatedData);
  }
}
