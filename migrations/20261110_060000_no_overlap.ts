import { type MigrateUpArgs, type MigrateDownArgs, sql } from '@payloadcms/db-postgres';

// The database, not the app, refuses double bookings. '[)' lets 10–12 and 12–14 sit side by side;
// cancelled and expired rows don't block. A conflicting insert fails with SQLSTATE 23P01.
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE EXTENSION IF NOT EXISTS btree_gist;
    ALTER TABLE "bookings" ADD CONSTRAINT "bookings_no_overlap"
      EXCLUDE USING gist ("studio_id" WITH =, tstzrange("start", "end", '[)') WITH &&)
      WHERE ("status" IN ('hold', 'requested', 'confirmed'));
    ALTER TABLE "bookings" ADD CONSTRAINT "bookings_end_after_start" CHECK ("end" > "start");
  `);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "bookings" DROP CONSTRAINT IF EXISTS "bookings_no_overlap";
    ALTER TABLE "bookings" DROP CONSTRAINT IF EXISTS "bookings_end_after_start";
  `);
}
