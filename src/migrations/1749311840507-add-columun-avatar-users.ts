import { MigrationInterface, QueryRunner } from "typeorm";

export class AddColumunAvatarUsers1749311840507 implements MigrationInterface {
    name = 'AddColumunAvatarUsers1749311840507'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "avatar" character varying(255)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "avatar"`);
    }

}
