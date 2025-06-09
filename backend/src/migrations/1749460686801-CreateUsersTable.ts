import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateUsersTable1749460686801 implements MigrationInterface {
    name = 'CreateUsersTable1749460686801'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "diaberry"."diary_share" ("diary_id" integer NOT NULL, "user_id" integer NOT NULL, "status" boolean NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_73649c9e7a379b814f98781d6a8" PRIMARY KEY ("diary_id", "user_id"))`);
        await queryRunner.query(`ALTER TABLE "diaberry"."diary_share" ADD CONSTRAINT "FK_2c7433da6d45410406d418bfb3b" FOREIGN KEY ("user_id") REFERENCES "diaberry"."user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "diaberry"."diary_share" ADD CONSTRAINT "FK_bd3f25dc5e4f6bb9a16a05742a4" FOREIGN KEY ("diary_id") REFERENCES "diaberry"."diary"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "diaberry"."diary_share" DROP CONSTRAINT "FK_bd3f25dc5e4f6bb9a16a05742a4"`);
        await queryRunner.query(`ALTER TABLE "diaberry"."diary_share" DROP CONSTRAINT "FK_2c7433da6d45410406d418bfb3b"`);
        await queryRunner.query(`DROP TABLE "diaberry"."diary_share"`);
    }

}
