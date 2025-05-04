import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateTablePosts1746151380773 implements MigrationInterface {
    name = 'UpdateTablePosts1746151380773'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "posts" DROP COLUMN "imagem"`);
        await queryRunner.query(`ALTER TABLE "posts" ADD "caminho_imagem" character varying`);
        await queryRunner.query(`ALTER TABLE "posts" DROP COLUMN "avaliacao"`);
        await queryRunner.query(`ALTER TABLE "posts" ADD "avaliacao" integer NOT NULL DEFAULT '1'`);
        await queryRunner.query(`ALTER TABLE "posts" ADD CONSTRAINT "CHK_86916f9aa2adf59012069e5690" CHECK ("avaliacao" BETWEEN 1 AND 5)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "posts" DROP CONSTRAINT "CHK_86916f9aa2adf59012069e5690"`);
        await queryRunner.query(`ALTER TABLE "posts" DROP COLUMN "avaliacao"`);
        await queryRunner.query(`ALTER TABLE "posts" ADD "avaliacao" character varying(255) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "posts" DROP COLUMN "caminho_imagem"`);
        await queryRunner.query(`ALTER TABLE "posts" ADD "imagem" character varying`);
    }

}
