import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1710000000000 implements MigrationInterface {
  name = 'InitialSchema1710000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

    await queryRunner.query(`
      CREATE TYPE "public"."user_role_enum" AS ENUM('user', 'platform')
    `);

    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "email" character varying(150) NOT NULL,
        "name" character varying(120) NOT NULL,
        "password_hash" character varying(255),
        "role" "public"."user_role_enum" NOT NULL DEFAULT 'user',
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_users_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_users_email" UNIQUE ("email")
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "public"."trade_forms_status_enum" AS ENUM('draft','pending','verified','confirmed','cancelled','failed','done')
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

    await queryRunner.query(`
      CREATE TABLE "idempotency_keys" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "key" character varying(128) NOT NULL,
        "route" character varying(256) NOT NULL,
        "actor_id" uuid NOT NULL,
        "status_code" integer NOT NULL,
        "response_body" jsonb NOT NULL,
        "result_hash" character varying(128) NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        CONSTRAINT "PK_idempotency_keys_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_idempotency_key" UNIQUE ("key"),
        CONSTRAINT "FK_idempotency_actor" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_idempotency_actor" ON "idempotency_keys" ("actor_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_idempotency_actor"');
    await queryRunner.query('DROP TABLE "idempotency_keys"');

    await queryRunner.query('DROP INDEX IF EXISTS "UQ_trade_confirm_unique_actor"');
    await queryRunner.query('DROP TABLE "trade_confirmations"');
    await queryRunner.query('DROP TYPE "public"."trade_confirmations_role_enum"');

    await queryRunner.query('DROP INDEX IF EXISTS "IDX_trade_audit_action"');
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_trade_audit_actor"');
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_trade_audit_trade_uid"');
    await queryRunner.query('DROP TABLE "trade_audit_events"');
    await queryRunner.query('DROP TYPE "public"."trade_audit_events_action_enum"');

    await queryRunner.query('DROP INDEX IF EXISTS "IDX_trade_forms_status"');
    await queryRunner.query('DROP TABLE "trade_forms"');
    await queryRunner.query('DROP TYPE "public"."trade_forms_status_enum"');

    await queryRunner.query('DROP TABLE "users"');
    await queryRunner.query('DROP TYPE "public"."user_role_enum"');
  }
}
