import { User } from 'src/users/user.entity';
import { Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';

@Entity('follows')
export class Follow {
  // Chave primária composta, parte 1: ID do seguidor
  @PrimaryColumn()
  public followerId: string;

  // Chave primária composta, parte 2: ID de quem está sendo seguido
  @PrimaryColumn()
  public followingId: string;

  // Relação Many-to-One com UserEntity para o seguidor
  @ManyToOne(() => User, (user) => user.following)
  @JoinColumn({ name: 'followerId' })
  follower: User;

  // Relação Many-to-One com User para quem é seguido
  @ManyToOne(() => User, (user) => user.followers)
  @JoinColumn({ name: 'followingId' })
  following: User;
}