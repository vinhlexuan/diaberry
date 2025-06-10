import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateUsersTable1749559622758 implements MigrationInterface {
    name = 'CreateUsersTable1749559622758'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "diaberry"."user" ADD "google_id" character varying`);
        await queryRunner.query(`ALTER TABLE "diaberry"."user" ADD "avatar_url" character varying`);
        await queryRunner.query(`ALTER TABLE "diaberry"."user" ADD "provider" character varying NOT NULL DEFAULT 'google'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "diaberry"."user" DROP COLUMN "provider"`);
        await queryRunner.query(`ALTER TABLE "diaberry"."user" DROP COLUMN "avatar_url"`);
        await queryRunner.query(`ALTER TABLE "diaberry"."user" DROP COLUMN "google_id"`);
    }

}
