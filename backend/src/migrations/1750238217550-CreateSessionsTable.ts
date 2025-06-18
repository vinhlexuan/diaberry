import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateSessionsTable1750238217550 implements MigrationInterface {
    name = 'CreateSessionsTable1750238217550'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "diaberry"."session" ("id" SERIAL NOT NULL, "token" character varying(255) NOT NULL, "user_id" integer NOT NULL, "expires_at" TIMESTAMP NOT NULL, "refresh_token" character varying, "user_agent" character varying, "ip_address" character varying, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_232f8e85d7633bd6ddfad421696" UNIQUE ("token"), CONSTRAINT "PK_f55da76ac1c3ac420f444d2ff11" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_SESSION_USER" ON "diaberry"."session" ("user_id") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_SESSION_TOKEN" ON "diaberry"."session" ("token") `);
        await queryRunner.query(`ALTER TABLE "diaberry"."user" ADD CONSTRAINT "UQ_7adac5c0b28492eb292d4a93871" UNIQUE ("google_id")`);
        await queryRunner.query(`ALTER TABLE "diaberry"."session" ADD CONSTRAINT "FK_30e98e8746699fb9af235410aff" FOREIGN KEY ("user_id") REFERENCES "diaberry"."user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "diaberry"."session" DROP CONSTRAINT "FK_30e98e8746699fb9af235410aff"`);
        await queryRunner.query(`ALTER TABLE "diaberry"."user" DROP CONSTRAINT "UQ_7adac5c0b28492eb292d4a93871"`);
        await queryRunner.query(`DROP INDEX "diaberry"."IDX_SESSION_TOKEN"`);
        await queryRunner.query(`DROP INDEX "diaberry"."IDX_SESSION_USER"`);
        await queryRunner.query(`DROP TABLE "diaberry"."session"`);
    }

}
