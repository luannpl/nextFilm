import { MigrationInterface, QueryRunner } from "typeorm";

export class ImagemOpcional1746119606296 implements MigrationInterface {
    name = 'ImagemOpcional1746119606296'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "posts" DROP COLUMN "imagem"`);
        await queryRunner.query(`ALTER TABLE "posts" ADD "imagem" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "posts" DROP COLUMN "imagem"`);
        await queryRunner.query(`ALTER TABLE "posts" ADD "imagem" character varying(255) NOT NULL`);
    }

}
