import { MigrationInterface, QueryRunner } from 'typeorm';

export class UserIdentityAndVerifierTables1719000000000 implements MigrationInterface {
  name = 'UserIdentityAndVerifierTables1719000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN IF NOT EXISTS "id_number" character varying(20)
    `);
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN IF NOT EXISTS "birthday" character varying(20)
    `);
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN IF NOT EXISTS "address" character varying(128)
    `);
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN IF NOT EXISTS "score" numeric(3,2) NOT NULL DEFAULT 3.00
    `);

    await queryRunner.query(`
      UPDATE "users"
      SET "id_number" = LEFT(
        COALESCE(
          NULLIF(REGEXP_REPLACE("email", '[^A-Za-z0-9]', '', 'g'), ''),
          REPLACE("id"::text, '-', '')
        ),
        20
      )
      WHERE "id_number" IS NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "users"
      ALTER COLUMN "id_number" SET NOT NULL
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'UQ_users_id_number'
        ) THEN
          ALTER TABLE "users"
          ADD CONSTRAINT "UQ_users_id_number" UNIQUE ("id_number");
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      ALTER TABLE "users"
      DROP CONSTRAINT IF EXISTS "UQ_users_email"
    `);
    await queryRunner.query(`
      ALTER TABLE "users"
      DROP COLUMN IF EXISTS "email"
    `);
    await queryRunner.query(`
      ALTER TABLE "users"
      DROP COLUMN IF EXISTS "password_hash"
    `);

    await queryRunner.query(`
      ALTER TABLE "idempotency_keys"
      ALTER COLUMN "response_body" DROP NOT NULL
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'verification_tx_status_enum') THEN
          CREATE TYPE "public"."verification_tx_status_enum" AS ENUM('pending', 'success', 'failed');
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'verification_tx_kind_enum') THEN
          CREATE TYPE "public"."verification_tx_kind_enum" AS ENUM('verifier');
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "verification_tx" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "transaction_id" character varying(64) NOT NULL,
        "kind" "public"."verification_tx_kind_enum" NOT NULL DEFAULT 'verifier',
        "ref" character varying,
        "status" "public"."verification_tx_status_enum" NOT NULL DEFAULT 'pending',
        "result_json" jsonb,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_verification_tx_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_verification_tx_transaction_id"
      ON "verification_tx" ("transaction_id")
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "issued_credentials" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "transaction_id" character varying(64) NOT NULL,
        "credential_jwt" text,
        "cid" character varying(128),
        "meta" jsonb DEFAULT '{}'::jsonb,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_issued_credentials_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_issued_credentials_transaction_id"
      ON "issued_credentials" ("transaction_id")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_issued_credentials_cid"
      ON "issued_credentials" ("cid")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_trade_forms_creator_id"
      ON "trade_forms" ("creator_id")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_trade_forms_counterparty_id"
      ON "trade_forms" ("counterparty_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_trade_forms_counterparty_id"');
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_trade_forms_creator_id"');
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_issued_credentials_cid"');
    await queryRunner.query('DROP INDEX IF EXISTS "UQ_issued_credentials_transaction_id"');
    await queryRunner.query('DROP TABLE IF EXISTS "issued_credentials"');

    await queryRunner.query('DROP INDEX IF EXISTS "UQ_verification_tx_transaction_id"');
    await queryRunner.query('DROP TABLE IF EXISTS "verification_tx"');
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'verification_tx_kind_enum') THEN
          DROP TYPE "public"."verification_tx_kind_enum";
        END IF;
      END
      $$;
    `);
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'verification_tx_status_enum') THEN
          DROP TYPE "public"."verification_tx_status_enum";
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      ALTER TABLE "idempotency_keys"
      ALTER COLUMN "response_body" SET NOT NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN IF NOT EXISTS "email" character varying(150)
    `);
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN IF NOT EXISTS "password_hash" character varying(255)
    `);

    await queryRunner.query(`
      UPDATE "users"
      SET "email" = CONCAT('user+', substring("id"::text, 1, 8), '@placeholder.local')
      WHERE "email" IS NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "users"
      ALTER COLUMN "email" SET NOT NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "users"
      ADD CONSTRAINT "UQ_users_email" UNIQUE ("email")
    `);

    await queryRunner.query(`
      ALTER TABLE "users"
      DROP CONSTRAINT IF EXISTS "UQ_users_id_number"
    `);
    await queryRunner.query(`
      ALTER TABLE "users"
      DROP COLUMN IF EXISTS "id_number"
    `);
    await queryRunner.query(`
      ALTER TABLE "users"
      DROP COLUMN IF EXISTS "birthday"
    `);
    await queryRunner.query(`
      ALTER TABLE "users"
      DROP COLUMN IF EXISTS "address"
    `);
    await queryRunner.query(`
      ALTER TABLE "users"
      DROP COLUMN IF EXISTS "score"
    `);
  }
}
