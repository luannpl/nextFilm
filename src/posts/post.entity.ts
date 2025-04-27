import { User } from 'src/users/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'posts' })
export class Post {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  titulo: string;

  @Column({ type: 'text', nullable: false })
  descricao: string;

  @Column({ type: 'int', nullable: false, default: 0 })
  curtidas: number;

  @Column({ type: 'varchar', length: 255, nullable: false })
  imagem: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  avaliacao: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  filme_id: string;

  @ManyToOne(() => User, (user) => user.posts, { onDelete: 'CASCADE' })
  user: User;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}
