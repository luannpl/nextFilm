import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateTablePostagens1749251739199 implements MigrationInterface {
    name = 'CreateTablePostagens1749251739199'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "comments" DROP CONSTRAINT "FK_comments_reviews"`);
        await queryRunner.query(`ALTER TABLE "reviews" DROP CONSTRAINT "FK_c4f9a7bd77b489e711277ee5986"`);
        await queryRunner.query(`ALTER TABLE "reviews" DROP CONSTRAINT "CHK_86916f9aa2adf59012069e5690"`);
        await queryRunner.query(`ALTER TABLE "comments" RENAME COLUMN "review_id" TO "post_id"`);
        await queryRunner.query(`CREATE TABLE "postagens" ("id" SERIAL NOT NULL, "content" text NOT NULL, "image_path" character varying, "likes_count" integer NOT NULL DEFAULT '0', "comments_count" integer NOT NULL DEFAULT '0', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "user_id" uuid, CONSTRAINT "PK_384a39103a96cc834ce46949fc6" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "reviews" ADD "caminho_imagem" character varying`);
        await queryRunner.query(`ALTER TABLE "comments" DROP COLUMN "post_id"`);
        await queryRunner.query(`ALTER TABLE "comments" ADD "post_id" integer`);
        await queryRunner.query(`ALTER TABLE "reviews" ADD CONSTRAINT "CHK_3475726b88edd3826031c301cf" CHECK ("avaliacao" BETWEEN 1 AND 5)`);
        await queryRunner.query(`ALTER TABLE "postagens" ADD CONSTRAINT "FK_2a652aefea13baaad61197fb50c" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "comments" ADD CONSTRAINT "FK_259bf9825d9d198608d1b46b0b5" FOREIGN KEY ("post_id") REFERENCES "postagens"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "reviews" ADD CONSTRAINT "FK_728447781a30bc3fcfe5c2f1cdf" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "reviews" DROP CONSTRAINT "FK_728447781a30bc3fcfe5c2f1cdf"`);
        await queryRunner.query(`ALTER TABLE "comments" DROP CONSTRAINT "FK_259bf9825d9d198608d1b46b0b5"`);
        await queryRunner.query(`ALTER TABLE "postagens" DROP CONSTRAINT "FK_2a652aefea13baaad61197fb50c"`);
        await queryRunner.query(`ALTER TABLE "reviews" DROP CONSTRAINT "CHK_3475726b88edd3826031c301cf"`);
        await queryRunner.query(`ALTER TABLE "comments" DROP COLUMN "post_id"`);
        await queryRunner.query(`ALTER TABLE "comments" ADD "post_id" uuid`);
        await queryRunner.query(`ALTER TABLE "reviews" DROP COLUMN "caminho_imagem"`);
        await queryRunner.query(`DROP TABLE "postagens"`);
        await queryRunner.query(`ALTER TABLE "comments" RENAME COLUMN "post_id" TO "review_id"`);
        await queryRunner.query(`ALTER TABLE "reviews" ADD CONSTRAINT "CHK_86916f9aa2adf59012069e5690" CHECK (((avaliacao >= 1) AND (avaliacao <= 5)))`);
        await queryRunner.query(`ALTER TABLE "reviews" ADD CONSTRAINT "FK_c4f9a7bd77b489e711277ee5986" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "comments" ADD CONSTRAINT "FK_comments_reviews" FOREIGN KEY ("review_id") REFERENCES "reviews"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
