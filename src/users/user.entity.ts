import { Comment } from 'src/comments/comment.entity';
import { Follow } from 'src/follow/entities/follow.entity';
import { Like } from 'src/likes/like.entity';
import { Post } from 'src/posts/post.entity';
import { Review } from 'src/reviews/review.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50, nullable: false })
  nome: string;

  @Column({ type: 'varchar', length: 50, nullable: false })
  sobrenome: string;

  @Column({ type: 'varchar', length: 50, nullable: false })
  usuario: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  email: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  senha: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  avatar: string;

  @Column({ type: 'text', nullable: true })
  bio: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  cidade: string;

  @OneToMany(() => Post, (post) => post.user)
  posts: Post[];

  @OneToMany(() => Review, (Review) => Review.user, { cascade: true })
  reviews: Review[];

  @OneToMany(() => Comment, (comment) => comment.user)
  comments: Comment[];

  @OneToMany(() => Like, (like) => like.user, {
    cascade: true,
  })
  likes: Like[];

  @OneToMany(() => Follow, (follow) => follow.follower)
  following: Follow[];

  // Relação: Registros de "Follow" onde este usuário é o SEGUIDO.
  @OneToMany(() => Follow, (follow) => follow.following)
  followers: Follow[];

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}
