import {
  BadRequestException,
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
import { Follow } from 'src/follow/entities/follow.entity';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);
  private supabase: SupabaseClient;
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @Inject(forwardRef(() => AuthService))
    private readonly authService: AuthService,

    @InjectRepository(Follow)
    private readonly followRepository: Repository<Follow>,
  ) {
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY,
    );
  }

  async getUserById(profileId: string, currentUserId?: string) {
    this.logger.log(`Getting user with id: ${profileId}`);
    
    const user = await this.userRepository.findOne({
      where: { id: profileId },
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
      this.logger.warn(`User with id ${profileId} not found`);
      throw new NotFoundException(`Usuário com id ${profileId} não encontrado`);
    }

    let isFollowing = false;

    // A verificação só faz sentido se houver um usuário logado (currentUserId)
    // e se ele não estiver visualizando o próprio perfil.
    if (currentUserId && currentUserId !== profileId) {
      this.logger.log(`Checking follow status for viewer ${currentUserId} on profile ${profileId}`);
      const follow = await this.followRepository.findOneBy({
        followerId: currentUserId,
        followingId: profileId,
      });
      
      // '!!follow' converte o objeto (se encontrado) para true, e null/undefined para false.
      isFollowing = !!follow; 
      this.logger.log(`Follow status is: ${isFollowing}`);
    }

    // A lógica do Supabase para o avatar continua a mesma
    if (user.avatar) {
      this.logger.log(`Generating signed URL for avatar: ${user.avatar}`);
      const { data, error } = await this.supabase.storage
        .from('nextfilms')
        .createSignedUrl(user.avatar, 3600); // 1 hora

      if (error) {
        this.logger.error(`Error generating signed URL for avatar ${user.avatar}: ${error.message}`);
        user.avatar = null; // Ou uma URL de fallback
      } else {
        this.logger.log('Signed URL for avatar generated successfully.');
        user.avatar = data.signedUrl;
      }
    }
    
    // Retorna o objeto do usuário com a nova propriedade 'isFollowing'
    return { ...user, isFollowing };
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
    const user = await this.userRepository.findOne({
      where: { id },
    });

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


  // Métodos para seguir e deixar de seguir usuários
  async followUser(followerId: string, followingId: string) {
    if (followerId === followingId) {
      throw new BadRequestException('Você não pode seguir a si mesmo.');
    }

    // Verifica se o usuário a ser seguido existe
    const userToFollow = await this.userRepository.findOneBy({ id: followingId });
    if (!userToFollow) {
      throw new NotFoundException('Usuário a ser seguido não encontrado.');
    }

    const existingFollow = await this.followRepository.findOneBy({ followerId, followingId });
    if (existingFollow) {
      throw new ConflictException('Você já segue este usuário.');
    }

    const follow = this.followRepository.create({ followerId, followingId });
    await this.followRepository.save(follow);
    
    return { message: 'Usuário seguido com sucesso!' };
  }
  
  async unfollowUser(followerId: string, followingId: string) {
    const result = await this.followRepository.delete({ followerId, followingId });

    if (result.affected === 0) {
      throw new NotFoundException('Você não segue este usuário.');
    }
  }

  async getFollowing(userId: string): Promise<User[]> {
    const follows = await this.followRepository.find({
      where: { followerId: userId },
      relations: ['following'], // 'following' é o nome da propriedade na FollowEntity
    });
    // Mapeia para retornar apenas a lista de usuários, removendo a camada de 'FollowEntity'
    return follows.map(follow => follow.following);
  }

  async getFollowers(userId: string): Promise<User[]> {
    const follows = await this.followRepository.find({
      where: { followingId: userId },
      relations: ['follower'], // 'follower' é o nome da propriedade na FollowEntity
    });
    return follows.map(follow => follow.follower);
  }
}
