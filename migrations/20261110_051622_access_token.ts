import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "bookings" ADD COLUMN "access_token" varchar;
  CREATE INDEX "bookings_access_token_idx" ON "bookings" USING btree ("access_token");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX "bookings_access_token_idx";
  ALTER TABLE "bookings" DROP COLUMN "access_token";`)
}
