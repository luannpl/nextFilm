import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateTablePosts1745725665726 implements MigrationInterface {
    name = 'CreateTablePosts1745725665726'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "posts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "titulo" character varying(255) NOT NULL, "descricao" text NOT NULL, "curtidas" integer NOT NULL DEFAULT '0', "imagem" character varying(255) NOT NULL, "avaliacao" character varying(255) NOT NULL, "filme_id" character varying(255) NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "user_id" uuid, CONSTRAINT "PK_2829ac61eff60fcec60d7274b9e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "posts" ADD CONSTRAINT "FK_c4f9a7bd77b489e711277ee5986" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "posts" DROP CONSTRAINT "FK_c4f9a7bd77b489e711277ee5986"`);
        await queryRunner.query(`DROP TABLE "posts"`);
    }

}
