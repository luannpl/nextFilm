import { User } from 'src/users/user.entity';
import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'reviews' })
@Check(`"avaliacao" BETWEEN 1 AND 5`)
export class Review {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  titulo: string;

  @Column({ type: 'text', nullable: false })
  descricao: string;

  @Column({ nullable: true })
  caminho_imagem: string;

  @Column({ type: 'int', nullable: false, default: 1 })
  avaliacao: number;

  @Column({ type: 'varchar', length: 255, nullable: false })
  filme_id: string;

  @ManyToOne(() => User, (user) => user.reviews, { onDelete: 'CASCADE' })
  user: User;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}
