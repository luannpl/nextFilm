import { MigrationInterface, QueryRunner } from 'typeorm';

export class RenameTablePostsToReviews1749218211603
  implements MigrationInterface
{
  name = 'RenameTablePostsToReviews1749218211603';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Remove a foreign key de comments -> posts
    await queryRunner.query(
      `ALTER TABLE "comments" DROP CONSTRAINT "FK_259bf9825d9d198608d1b46b0b5"`,
    );

    // Renomeia a tabela posts para reviews
    await queryRunner.query(`ALTER TABLE "posts" RENAME TO "reviews"`);

    // (opcional) Renomeia a coluna em comments, se quiser trocar `post_id` para `review_id`
    await queryRunner.query(
      `ALTER TABLE "comments" RENAME COLUMN "post_id" TO "review_id"`,
    );

    // Recria a foreign key, agora apontando para "reviews"
    await queryRunner.query(
      `ALTER TABLE "comments" ADD CONSTRAINT "FK_comments_reviews" FOREIGN KEY ("review_id") REFERENCES "reviews"("id") ON DELETE CASCADE`,
    );

    await queryRunner.query(
      `ALTER TABLE "reviews" DROP COLUMN IF EXISTS "caminho_imagem"`,
    );
    await queryRunner.query(
      `ALTER TABLE "reviews" DROP COLUMN IF EXISTS "curtidas"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove a FK de comments -> reviews
    await queryRunner.query(
      `ALTER TABLE "comments" DROP CONSTRAINT "FK_comments_reviews"`,
    );

    // Renomeia a coluna de volta (se tiver renomeado)
    await queryRunner.query(
      `ALTER TABLE "comments" RENAME COLUMN "review_id" TO "post_id"`,
    );

    // Renomeia a tabela de volta
    await queryRunner.query(`ALTER TABLE "reviews" RENAME TO "posts"`);

    // Recria a foreign key antiga
    await queryRunner.query(
      `ALTER TABLE "comments" ADD CONSTRAINT "FK_259bf9825d9d198608d1b46b0b5" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE`,
    );
  }
}
