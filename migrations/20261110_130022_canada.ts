import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_studios_province" AS ENUM('ON', 'QC', 'BC', 'AB');
  CREATE TYPE "public"."enum_studios_timezone" AS ENUM('America/Toronto', 'America/Edmonton', 'America/Vancouver');
  -- Existing rows are the London demo; the seed replaces them. Move them to a valid zone before the cast.
  ALTER TABLE "studios" ALTER COLUMN "timezone" DROP DEFAULT;
  UPDATE "studios" SET "timezone" = 'America/Toronto';
  ALTER TABLE "studios" ALTER COLUMN "timezone" SET DATA TYPE "public"."enum_studios_timezone" USING "timezone"::"public"."enum_studios_timezone";
  ALTER TABLE "studios" ALTER COLUMN "timezone" SET DEFAULT 'America/Toronto'::"public"."enum_studios_timezone";
  ALTER TABLE "studios" ALTER COLUMN "timezone" SET NOT NULL;
  ALTER TABLE "studios" ADD COLUMN "province" "enum_studios_province" DEFAULT 'ON' NOT NULL;
  ALTER TABLE "studios" ADD COLUMN "lat" numeric DEFAULT 43.65 NOT NULL;
  ALTER TABLE "studios" ALTER COLUMN "lat" DROP DEFAULT;
  ALTER TABLE "studios" ADD COLUMN "lng" numeric DEFAULT -79.38 NOT NULL;
  ALTER TABLE "studios" ALTER COLUMN "lng" DROP DEFAULT;
  ALTER TABLE "studios" DROP COLUMN "map_x";
  ALTER TABLE "studios" DROP COLUMN "map_y";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "studios" ALTER COLUMN "timezone" DROP DEFAULT;
  ALTER TABLE "studios" ALTER COLUMN "timezone" SET DATA TYPE varchar;
  ALTER TABLE "studios" ALTER COLUMN "timezone" SET DEFAULT 'Europe/London';
  ALTER TABLE "studios" ALTER COLUMN "timezone" DROP NOT NULL;
  ALTER TABLE "studios" ADD COLUMN "map_x" numeric;
  ALTER TABLE "studios" ADD COLUMN "map_y" numeric;
  ALTER TABLE "studios" DROP COLUMN "province";
  ALTER TABLE "studios" DROP COLUMN "lat";
  ALTER TABLE "studios" DROP COLUMN "lng";
  DROP TYPE "public"."enum_studios_province";
  DROP TYPE "public"."enum_studios_timezone";`)
}
