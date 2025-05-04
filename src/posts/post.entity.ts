import { Comment } from 'src/comments/comment.entity';
import { User } from 'src/users/user.entity';
import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'posts' })
@Check(`"avaliacao" BETWEEN 1 AND 5`)
export class Post {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  titulo: string;

  @Column({ type: 'text', nullable: false })
  descricao: string;

  @Column({ type: 'int', nullable: false, default: 0 })
  curtidas: number;

  @Column({ nullable: true })
  caminho_imagem: string;

  @Column({ type: 'int', nullable: false, default: 1 })
  avaliacao: number;

  @Column({ type: 'varchar', length: 255, nullable: false })
  filme_id: string;

  @ManyToOne(() => User, (user) => user.posts, { onDelete: 'CASCADE' })
  user: User;

  @OneToMany(() => Comment, (comment) => comment.post, { cascade: true })
  comments: Comment[];

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}
