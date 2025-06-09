import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateUsersTable1749460589179 implements MigrationInterface {
    name = 'CreateUsersTable1749460589179'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "diaberry"."diary" ("id" SERIAL NOT NULL, "date" TIMESTAMP NOT NULL, "content" text NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "user_id" integer, CONSTRAINT "PK_7422c55a0908c4271ff1918437d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "diaberry"."user" ("id" SERIAL NOT NULL, "email" character varying NOT NULL, "password_hash" character varying, "first_name" character varying, "last_name" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE ("email"), CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "diaberry"."diary" ADD CONSTRAINT "FK_330f20310184a92a90225c36cbe" FOREIGN KEY ("user_id") REFERENCES "diaberry"."user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "diaberry"."diary" DROP CONSTRAINT "FK_330f20310184a92a90225c36cbe"`);
        await queryRunner.query(`DROP TABLE "diaberry"."user"`);
        await queryRunner.query(`DROP TABLE "diaberry"."diary"`);
    }

}
