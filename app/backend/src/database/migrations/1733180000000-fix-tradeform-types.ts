import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixTradeformTypes1733180000000 implements MigrationInterface {
  name = 'FixTradeformTypes1733180000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE trade_forms ALTER COLUMN uid TYPE varchar(128)`);
    await queryRunner.query(`ALTER TABLE trade_forms ALTER COLUMN creator_id TYPE varchar(64)`);
    await queryRunner.query(`ALTER TABLE trade_forms ALTER COLUMN creator_id SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE trade_forms ALTER COLUMN counterparty_id TYPE varchar(64)`);
    await queryRunner.query(`ALTER TABLE trade_forms ALTER COLUMN item_name TYPE varchar(255)`);
    await queryRunner.query(`ALTER TABLE trade_forms ALTER COLUMN item_condition TYPE varchar(64)`);
    await queryRunner.query(`ALTER TABLE trade_forms ALTER COLUMN trade_channel TYPE varchar(64)`);
    await queryRunner.query(`ALTER TABLE trade_forms ALTER COLUMN payment_method TYPE varchar(64)`);
    await queryRunner.query(
      `ALTER TABLE trade_forms ALTER COLUMN matchmaking_channel TYPE varchar(64)`
    );
    await queryRunner.query(
      `ALTER TABLE trade_forms ALTER COLUMN amount TYPE numeric(36,18) USING amount::numeric`
    );
    await queryRunner.query(
      `ALTER TABLE trade_forms ALTER COLUMN identity_requirements TYPE text[] USING identity_requirements::text[]`
    );
    await queryRunner.query(
      `ALTER TABLE trade_forms ALTER COLUMN identity_requirements SET DEFAULT ARRAY[]::text[]`
    );
    await queryRunner.query(
      `ALTER TABLE trade_forms ALTER COLUMN user_rating SET DEFAULT 0`
    );
    await queryRunner.query(
      `DROP TYPE IF EXISTS trade_forms_item_condition_enum`
    );
    await queryRunner.query(`DROP TYPE IF EXISTS trade_forms_channel_enum`);
    await queryRunner.query(`DROP TYPE IF EXISTS trade_forms_payment_method_enum`);
    await queryRunner.query(`DROP TYPE IF EXISTS trade_forms_matchmaking_channel_enum`);
    await queryRunner.query(`DROP TYPE IF EXISTS trade_forms_identity_requirement_enum`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE trade_forms ALTER COLUMN uid TYPE varchar(32)`);
    await queryRunner.query(`ALTER TABLE trade_forms ALTER COLUMN creator_id TYPE varchar(255)`);
    await queryRunner.query(`ALTER TABLE trade_forms ALTER COLUMN creator_id DROP NOT NULL`);
    await queryRunner.query(
      `ALTER TABLE trade_forms ALTER COLUMN counterparty_id TYPE varchar(255)`
    );
    await queryRunner.query(`ALTER TABLE trade_forms ALTER COLUMN item_name TYPE varchar(160)`);
    await queryRunner.query(
      `ALTER TABLE trade_forms ALTER COLUMN amount TYPE varchar(64) USING amount::text`
    );
    await queryRunner.query(
      `ALTER TABLE trade_forms ALTER COLUMN identity_requirements SET DEFAULT ARRAY[]::text[]`
    );
    await queryRunner.query(
      `ALTER TABLE trade_forms ALTER COLUMN user_rating DROP DEFAULT`
    );
  }
}
