import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUserColumns1749270828809 implements MigrationInterface {
    name = 'AddUserColumns1749270828809'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "bio" text`);
        await queryRunner.query(`ALTER TABLE "users" ADD "cidade" character varying(255)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "cidade"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "bio"`);
    }

}
