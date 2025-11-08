import { MigrationInterface, QueryRunner } from 'typeorm';

export class TradeFormVcIntegration1716500000000 implements MigrationInterface {
  name = 'TradeFormVcIntegration1716500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'trade_forms_status_enum') THEN
          CREATE TYPE "public"."trade_forms_status_enum" AS ENUM(
            'draft',
            'pending',
            'verified',
            'confirmed',
            'cancelled',
            'failed',
            'done'
          );
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`ALTER TABLE "trade_forms" ADD COLUMN IF NOT EXISTS "uid" character varying(32)`);
    await queryRunner.query(`ALTER TABLE "trade_forms" ADD COLUMN IF NOT EXISTS "counterparty_id" uuid`);
    await queryRunner.query(`
      ALTER TABLE "trade_forms"
      ADD COLUMN IF NOT EXISTS "status" "public"."trade_forms_status_enum" NOT NULL DEFAULT 'pending'
    `);
    await queryRunner.query(`
      ALTER TABLE "trade_forms"
      ADD COLUMN IF NOT EXISTS "meta" jsonb NOT NULL DEFAULT '{}'
    `);
    await queryRunner.query(`
      ALTER TABLE "trade_forms"
      ADD COLUMN IF NOT EXISTS "confirmed_by_user1" boolean NOT NULL DEFAULT false
    `);
    await queryRunner.query(`
      ALTER TABLE "trade_forms"
      ADD COLUMN IF NOT EXISTS "confirmed_by_user2" boolean NOT NULL DEFAULT false
    `);
    await queryRunner.query(`
      ALTER TABLE "trade_forms"
      ADD COLUMN IF NOT EXISTS "vc_verified_at" TIMESTAMP WITH TIME ZONE
    `);
    await queryRunner.query(`
      ALTER TABLE "trade_forms"
      ADD COLUMN IF NOT EXISTS "uid_expires_at" TIMESTAMP WITH TIME ZONE
    `);
    await queryRunner.query(`
      ALTER TABLE "trade_forms"
      ADD COLUMN IF NOT EXISTS "finalized_at" TIMESTAMP WITH TIME ZONE
    `);
    await queryRunner.query(`
      ALTER TABLE "trade_forms"
      ADD COLUMN IF NOT EXISTS "finalize_attempts" integer NOT NULL DEFAULT 0
    `);
    await queryRunner.query(`
      ALTER TABLE "trade_forms"
      ADD COLUMN IF NOT EXISTS "finalize_failed_at" TIMESTAMP WITH TIME ZONE
    `);
    await queryRunner.query(`
      ALTER TABLE "trade_forms"
      ADD COLUMN IF NOT EXISTS "finalize_error" text
    `);

    await queryRunner.query(`
      UPDATE "trade_forms"
      SET "uid" = replace(uuid_generate_v4()::text, '-', '')
      WHERE "uid" IS NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "trade_forms"
      ALTER COLUMN "uid" SET NOT NULL
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'UQ_trade_forms_uid_unique'
        ) THEN
          ALTER TABLE "trade_forms"
          ADD CONSTRAINT "UQ_trade_forms_uid_unique" UNIQUE ("uid");
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_trade_forms_counterparty'
        ) THEN
          ALTER TABLE "trade_forms"
          ADD CONSTRAINT "FK_trade_forms_counterparty" FOREIGN KEY ("counterparty_id") REFERENCES "users"("id") ON DELETE SET NULL;
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_trade_forms_status_pending" ON "trade_forms" ("status")
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'trade_audit_events_action_enum') THEN
          CREATE TYPE "public"."trade_audit_events_action_enum" AS ENUM(
            'create',
            'verifyVC',
            'confirm',
            'cancel',
            'finalize',
            'fail',
            'retry'
          );
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "trade_audit_events" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "trade_uid" character varying(32) NOT NULL,
        "actor_id" uuid,
        "action" "public"."trade_audit_events_action_enum" NOT NULL,
        "at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "details" jsonb,
        CONSTRAINT "PK_trade_audit_events_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_trade_audit_trade" FOREIGN KEY ("trade_uid") REFERENCES "trade_forms"("uid") ON DELETE CASCADE,
        CONSTRAINT "FK_trade_audit_actor" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_trade_audit_trade_uid" ON "trade_audit_events" ("trade_uid")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_trade_audit_actor" ON "trade_audit_events" ("actor_id")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_trade_audit_action" ON "trade_audit_events" ("action")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_trade_audit_action"');
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_trade_audit_actor"');
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_trade_audit_trade_uid"');
    await queryRunner.query('DROP TABLE IF EXISTS "trade_audit_events"');
    await queryRunner.query('DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_type WHERE typname = \'trade_audit_events_action_enum\') THEN DROP TYPE "public"."trade_audit_events_action_enum"; END IF; END $$;');

    await queryRunner.query('DROP INDEX IF EXISTS "IDX_trade_forms_status_pending"');
    await queryRunner.query(
      'ALTER TABLE "trade_forms" DROP CONSTRAINT IF EXISTS "FK_trade_forms_counterparty"'
    );
    await queryRunner.query(
      'ALTER TABLE "trade_forms" DROP CONSTRAINT IF EXISTS "UQ_trade_forms_uid_unique"'
    );
    await queryRunner.query('ALTER TABLE "trade_forms" DROP COLUMN IF EXISTS "finalize_error"');
    await queryRunner.query(
      'ALTER TABLE "trade_forms" DROP COLUMN IF EXISTS "finalize_failed_at"'
    );
    await queryRunner.query('ALTER TABLE "trade_forms" DROP COLUMN IF EXISTS "finalize_attempts"');
    await queryRunner.query('ALTER TABLE "trade_forms" DROP COLUMN IF EXISTS "finalized_at"');
    await queryRunner.query('ALTER TABLE "trade_forms" DROP COLUMN IF EXISTS "uid_expires_at"');
    await queryRunner.query('ALTER TABLE "trade_forms" DROP COLUMN IF EXISTS "vc_verified_at"');
    await queryRunner.query(
      'ALTER TABLE "trade_forms" DROP COLUMN IF EXISTS "confirmed_by_user2"'
    );
    await queryRunner.query(
      'ALTER TABLE "trade_forms" DROP COLUMN IF EXISTS "confirmed_by_user1"'
    );
    await queryRunner.query('ALTER TABLE "trade_forms" DROP COLUMN IF EXISTS "meta"');
    await queryRunner.query('ALTER TABLE "trade_forms" DROP COLUMN IF EXISTS "status"');
    await queryRunner.query('ALTER TABLE "trade_forms" DROP COLUMN IF EXISTS "counterparty_id"');
    await queryRunner.query('ALTER TABLE "trade_forms" DROP COLUMN IF EXISTS "uid"');
    await queryRunner.query('DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_type WHERE typname = \'trade_forms_status_enum\') THEN DROP TYPE "public"."trade_forms_status_enum"; END IF; END $$;');
  }
}
