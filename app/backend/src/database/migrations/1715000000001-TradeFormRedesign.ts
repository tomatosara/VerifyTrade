import { MigrationInterface, QueryRunner } from 'typeorm';

export class TradeFormRedesign1715000000001 implements MigrationInterface {
  name = 'TradeFormRedesign1715000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS "trade_audit_events"');
    await queryRunner.query('DROP TABLE IF EXISTS "trade_confirmations"');
    await queryRunner.query('DROP TYPE IF EXISTS "public"."trade_confirmations_role_enum"');
    await queryRunner.query('DROP TYPE IF EXISTS "public"."trade_audit_events_action_enum"');

    await queryRunner.query('DROP TABLE IF EXISTS "trade_forms"');
    await queryRunner.query('DROP TYPE IF EXISTS "public"."trade_forms_status_enum"');

    await queryRunner.query(`
      CREATE TYPE "public"."trade_forms_item_condition_enum" AS ENUM(
        'SECOND_HAND',
        'LIKE_NEW',
        'BRAND_NEW'
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "public"."trade_forms_channel_enum" AS ENUM(
        'IN_PERSON',
        'CONVENIENCE_STORE_DELIVERY',
        'POST_OFFICE',
        'COURIER',
        'OTHER'
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "public"."trade_forms_payment_method_enum" AS ENUM(
        'CASH_ON_DELIVERY',
        'BANK_TRANSFER',
        'LINE_PAY',
        'CRYPTO'
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "public"."trade_forms_matchmaking_channel_enum" AS ENUM(
        'OFFLINE_AGREEMENT',
        'SOCIAL_PLATFORM',
        'ONLINE_MARKETPLACE'
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "public"."trade_forms_identity_requirement_enum" AS ENUM(
        'STUDENT_ID',
        'EMPLOYEE_ID',
        'DIETITIAN_LICENSE',
        'LAWYER_LICENSE',
        'PROOF_OF_ORIGIN'
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "trade_forms" (
        "id" SERIAL NOT NULL,
        "creator_id" uuid,
        "creator_verified_identities" jsonb NOT NULL DEFAULT '[]',
        "item_name" character varying(160) NOT NULL,
        "item_description" text NOT NULL,
        "item_condition" "public"."trade_forms_item_condition_enum" NOT NULL,
        "amount" character varying(64) NOT NULL,
        "trade_channel" "public"."trade_forms_channel_enum" NOT NULL,
        "payment_method" "public"."trade_forms_payment_method_enum" NOT NULL,
        "matchmaking_channel" "public"."trade_forms_matchmaking_channel_enum" NOT NULL,
        "identity_requirements" "public"."trade_forms_identity_requirement_enum"[] NOT NULL DEFAULT ARRAY[]::"public"."trade_forms_identity_requirement_enum"[],
        "user_rating" integer NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "CHK_trade_forms_user_rating_range" CHECK ("user_rating" BETWEEN 1 AND 5),
        CONSTRAINT "PK_trade_forms_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_trade_forms_creator_new" FOREIGN KEY ("creator_id") REFERENCES "users"("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_trade_forms_item_condition" ON "trade_forms" ("item_condition")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_trade_forms_trade_channel" ON "trade_forms" ("trade_channel")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_trade_forms_payment_method" ON "trade_forms" ("payment_method")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_trade_forms_payment_method"');
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_trade_forms_trade_channel"');
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_trade_forms_item_condition"');
    await queryRunner.query('DROP TABLE IF EXISTS "trade_forms"');

    await queryRunner.query('DROP TYPE IF EXISTS "public"."trade_forms_identity_requirement_enum"');
    await queryRunner.query('DROP TYPE IF EXISTS "public"."trade_forms_matchmaking_channel_enum"');
    await queryRunner.query('DROP TYPE IF EXISTS "public"."trade_forms_payment_method_enum"');
    await queryRunner.query('DROP TYPE IF EXISTS "public"."trade_forms_channel_enum"');
    await queryRunner.query('DROP TYPE IF EXISTS "public"."trade_forms_item_condition_enum"');

    await queryRunner.query(`
      CREATE TYPE "public"."trade_forms_status_enum" AS ENUM(
        'draft',
        'pending',
        'verified',
        'confirmed',
        'cancelled',
        'failed',
        'done'
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "trade_forms" (
        "uid" character varying(32) NOT NULL,
        "creator_id" uuid NOT NULL,
        "counterparty_id" uuid,
        "title" character varying(160) NOT NULL,
        "description" text NOT NULL,
        "amount" character varying(64),
        "status" "public"."trade_forms_status_enum" NOT NULL DEFAULT 'pending',
        "meta" jsonb NOT NULL DEFAULT '{}',
        "audit_log" jsonb NOT NULL DEFAULT '[]',
        "confirmed_by_user1" boolean NOT NULL DEFAULT false,
        "confirmed_by_user2" boolean NOT NULL DEFAULT false,
        "vc_verified_at" TIMESTAMP WITH TIME ZONE,
        "uid_expires_at" TIMESTAMP WITH TIME ZONE,
        "finalized_at" TIMESTAMP WITH TIME ZONE,
        "finalize_attempts" integer NOT NULL DEFAULT 0,
        "finalize_failed_at" TIMESTAMP WITH TIME ZONE,
        "finalize_error" text,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_trade_forms_uid" PRIMARY KEY ("uid"),
        CONSTRAINT "FK_trade_forms_creator" FOREIGN KEY ("creator_id") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_trade_forms_counterparty" FOREIGN KEY ("counterparty_id") REFERENCES "users"("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_trade_forms_status" ON "trade_forms" ("status") WHERE "status" IN ('pending','verified')
    `);

    await queryRunner.query(`
      CREATE TYPE "public"."trade_audit_events_action_enum" AS ENUM('create','verifyVC','confirm','cancel','finalize','fail','retry')
    `);

    await queryRunner.query(`
      CREATE TABLE "trade_audit_events" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "trade_uid" character varying(32) NOT NULL,
        "actor_id" uuid NOT NULL,
        "action" "public"."trade_audit_events_action_enum" NOT NULL,
        "at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "details" jsonb,
        CONSTRAINT "PK_trade_audit_events_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_trade_audit_trade" FOREIGN KEY ("trade_uid") REFERENCES "trade_forms"("uid") ON DELETE CASCADE,
        CONSTRAINT "FK_trade_audit_actor" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_trade_audit_trade_uid" ON "trade_audit_events" ("trade_uid")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_trade_audit_actor" ON "trade_audit_events" ("actor_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_trade_audit_action" ON "trade_audit_events" ("action")
    `);

    await queryRunner.query(`
      CREATE TYPE "public"."trade_confirmations_role_enum" AS ENUM('user1','user2')
    `);

    await queryRunner.query(`
      CREATE TABLE "trade_confirmations" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "trade_uid" character varying(32) NOT NULL,
        "actor_id" uuid NOT NULL,
        "role" "public"."trade_confirmations_role_enum" NOT NULL,
        "confirmed_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_trade_confirmations_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_trade_confirm_trade" FOREIGN KEY ("trade_uid") REFERENCES "trade_forms"("uid") ON DELETE CASCADE,
        CONSTRAINT "FK_trade_confirm_actor" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_trade_confirm_unique_actor" ON "trade_confirmations" ("trade_uid", "actor_id")
    `);
  }
}
