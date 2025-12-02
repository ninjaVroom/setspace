import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_users_roles" AS ENUM('guest', 'host', 'admin');
  CREATE TYPE "public"."enum_studios_status" AS ENUM('draft', 'review', 'live', 'paused');
  CREATE TYPE "public"."enum_studios_category" AS ENUM('daylight', 'podcast', 'film', 'workspace');
  CREATE TYPE "public"."enum_studios_mode" AS ENUM('instant', 'request');
  CREATE TYPE "public"."enum_studios_tier" AS ENUM('flexible', 'moderate', 'strict');
  CREATE TYPE "public"."enum_bookings_status" AS ENUM('hold', 'requested', 'confirmed', 'cancelled', 'completed', 'expired');
  CREATE TYPE "public"."enum_reviews_status" AS ENUM('published', 'reported', 'hidden');
  CREATE TABLE "users_roles" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_users_roles",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "users_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "users" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"stripe_customer_id" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"reset_password_requested_at" timestamp(3) with time zone,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE "studios_gallery" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"src" varchar NOT NULL
  );
  
  CREATE TABLE "studios_included" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"item" varchar NOT NULL
  );
  
  CREATE TABLE "studios_rules" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"text" varchar NOT NULL
  );
  
  CREATE TABLE "studios" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"slug" varchar NOT NULL,
  	"name" varchar NOT NULL,
  	"owner_id" integer NOT NULL,
  	"status" "enum_studios_status" DEFAULT 'draft',
  	"featured" boolean,
  	"category" "enum_studios_category" NOT NULL,
  	"city" varchar NOT NULL,
  	"area" varchar NOT NULL,
  	"postcode" varchar NOT NULL,
  	"map_x" numeric,
  	"map_y" numeric,
  	"photo" varchar NOT NULL,
  	"alt" varchar NOT NULL,
  	"hourly" numeric NOT NULL,
  	"min_hours" numeric NOT NULL,
  	"discount8h" numeric DEFAULT 0,
  	"cleaning_fee" numeric DEFAULT 0,
  	"m2" numeric NOT NULL,
  	"ceiling" numeric NOT NULL,
  	"capacity" numeric NOT NULL,
  	"light" varchar NOT NULL,
  	"mode" "enum_studios_mode" NOT NULL,
  	"tier" "enum_studios_tier" NOT NULL,
  	"open" numeric NOT NULL,
  	"close" numeric NOT NULL,
  	"timezone" varchar DEFAULT 'Europe/London',
  	"blurb" varchar NOT NULL,
  	"space" varchar NOT NULL,
  	"pull" varchar,
  	"lit" varchar,
  	"transit" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "bookings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"studio_id" integer NOT NULL,
  	"guest_id" integer,
  	"guest_name" varchar NOT NULL,
  	"guest_email" varchar,
  	"start" timestamp(3) with time zone NOT NULL,
  	"end" timestamp(3) with time zone NOT NULL,
  	"hours" numeric NOT NULL,
  	"guests" numeric DEFAULT 1,
  	"project" varchar,
  	"note" varchar,
  	"status" "enum_bookings_status" NOT NULL,
  	"total" numeric NOT NULL,
  	"service_fee" numeric NOT NULL,
  	"hold_expires_at" timestamp(3) with time zone,
  	"stripe_payment_intent_id" varchar,
  	"refund_amount" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "reviews" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"studio_id" integer NOT NULL,
  	"author" varchar NOT NULL,
  	"role" varchar,
  	"rating" numeric NOT NULL,
  	"date" varchar NOT NULL,
  	"body" varchar NOT NULL,
  	"status" "enum_reviews_status" DEFAULT 'published',
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "posts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"slug" varchar NOT NULL,
  	"title" varchar NOT NULL,
  	"standfirst" varchar NOT NULL,
  	"category" varchar NOT NULL,
  	"date" varchar NOT NULL,
  	"read" numeric NOT NULL,
  	"photo" varchar NOT NULL,
  	"author" varchar NOT NULL,
  	"body" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "posts_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"studios_id" integer
  );
  
  CREATE TABLE "faqs" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"group" varchar NOT NULL,
  	"q" varchar NOT NULL,
  	"a" varchar NOT NULL,
  	"order" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "stripe_events" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"event_id" varchar NOT NULL,
  	"type" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_kv" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"data" jsonb NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"global_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer,
  	"studios_id" integer,
  	"bookings_id" integer,
  	"reviews_id" integer,
  	"posts_id" integer,
  	"faqs_id" integer,
  	"stripe_events_id" integer
  );
  
  CREATE TABLE "payload_preferences" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"value" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_preferences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer
  );
  
  CREATE TABLE "payload_migrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"batch" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "users_roles" ADD CONSTRAINT "users_roles_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "users_sessions" ADD CONSTRAINT "users_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "studios_gallery" ADD CONSTRAINT "studios_gallery_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."studios"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "studios_included" ADD CONSTRAINT "studios_included_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."studios"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "studios_rules" ADD CONSTRAINT "studios_rules_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."studios"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "studios" ADD CONSTRAINT "studios_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "bookings" ADD CONSTRAINT "bookings_studio_id_studios_id_fk" FOREIGN KEY ("studio_id") REFERENCES "public"."studios"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "bookings" ADD CONSTRAINT "bookings_guest_id_users_id_fk" FOREIGN KEY ("guest_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "reviews" ADD CONSTRAINT "reviews_studio_id_studios_id_fk" FOREIGN KEY ("studio_id") REFERENCES "public"."studios"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "posts_rels" ADD CONSTRAINT "posts_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "posts_rels" ADD CONSTRAINT "posts_rels_studios_fk" FOREIGN KEY ("studios_id") REFERENCES "public"."studios"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_studios_fk" FOREIGN KEY ("studios_id") REFERENCES "public"."studios"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_bookings_fk" FOREIGN KEY ("bookings_id") REFERENCES "public"."bookings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_reviews_fk" FOREIGN KEY ("reviews_id") REFERENCES "public"."reviews"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_posts_fk" FOREIGN KEY ("posts_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_faqs_fk" FOREIGN KEY ("faqs_id") REFERENCES "public"."faqs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_stripe_events_fk" FOREIGN KEY ("stripe_events_id") REFERENCES "public"."stripe_events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "users_roles_order_idx" ON "users_roles" USING btree ("order");
  CREATE INDEX "users_roles_parent_idx" ON "users_roles" USING btree ("parent_id");
  CREATE INDEX "users_sessions_order_idx" ON "users_sessions" USING btree ("_order");
  CREATE INDEX "users_sessions_parent_id_idx" ON "users_sessions" USING btree ("_parent_id");
  CREATE INDEX "users_updated_at_idx" ON "users" USING btree ("updated_at");
  CREATE INDEX "users_created_at_idx" ON "users" USING btree ("created_at");
  CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");
  CREATE INDEX "studios_gallery_order_idx" ON "studios_gallery" USING btree ("_order");
  CREATE INDEX "studios_gallery_parent_id_idx" ON "studios_gallery" USING btree ("_parent_id");
  CREATE INDEX "studios_included_order_idx" ON "studios_included" USING btree ("_order");
  CREATE INDEX "studios_included_parent_id_idx" ON "studios_included" USING btree ("_parent_id");
  CREATE INDEX "studios_rules_order_idx" ON "studios_rules" USING btree ("_order");
  CREATE INDEX "studios_rules_parent_id_idx" ON "studios_rules" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "studios_slug_idx" ON "studios" USING btree ("slug");
  CREATE INDEX "studios_owner_idx" ON "studios" USING btree ("owner_id");
  CREATE INDEX "studios_status_idx" ON "studios" USING btree ("status");
  CREATE INDEX "studios_updated_at_idx" ON "studios" USING btree ("updated_at");
  CREATE INDEX "studios_created_at_idx" ON "studios" USING btree ("created_at");
  CREATE INDEX "bookings_studio_idx" ON "bookings" USING btree ("studio_id");
  CREATE INDEX "bookings_guest_idx" ON "bookings" USING btree ("guest_id");
  CREATE INDEX "bookings_start_idx" ON "bookings" USING btree ("start");
  CREATE INDEX "bookings_status_idx" ON "bookings" USING btree ("status");
  CREATE INDEX "bookings_stripe_payment_intent_id_idx" ON "bookings" USING btree ("stripe_payment_intent_id");
  CREATE INDEX "bookings_updated_at_idx" ON "bookings" USING btree ("updated_at");
  CREATE INDEX "bookings_created_at_idx" ON "bookings" USING btree ("created_at");
  CREATE INDEX "reviews_studio_idx" ON "reviews" USING btree ("studio_id");
  CREATE INDEX "reviews_updated_at_idx" ON "reviews" USING btree ("updated_at");
  CREATE INDEX "reviews_created_at_idx" ON "reviews" USING btree ("created_at");
  CREATE UNIQUE INDEX "posts_slug_idx" ON "posts" USING btree ("slug");
  CREATE INDEX "posts_updated_at_idx" ON "posts" USING btree ("updated_at");
  CREATE INDEX "posts_created_at_idx" ON "posts" USING btree ("created_at");
  CREATE INDEX "posts_rels_order_idx" ON "posts_rels" USING btree ("order");
  CREATE INDEX "posts_rels_parent_idx" ON "posts_rels" USING btree ("parent_id");
  CREATE INDEX "posts_rels_path_idx" ON "posts_rels" USING btree ("path");
  CREATE INDEX "posts_rels_studios_id_idx" ON "posts_rels" USING btree ("studios_id");
  CREATE INDEX "faqs_updated_at_idx" ON "faqs" USING btree ("updated_at");
  CREATE INDEX "faqs_created_at_idx" ON "faqs" USING btree ("created_at");
  CREATE UNIQUE INDEX "stripe_events_event_id_idx" ON "stripe_events" USING btree ("event_id");
  CREATE INDEX "stripe_events_updated_at_idx" ON "stripe_events" USING btree ("updated_at");
  CREATE INDEX "stripe_events_created_at_idx" ON "stripe_events" USING btree ("created_at");
  CREATE UNIQUE INDEX "payload_kv_key_idx" ON "payload_kv" USING btree ("key");
  CREATE INDEX "payload_locked_documents_global_slug_idx" ON "payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX "payload_locked_documents_updated_at_idx" ON "payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX "payload_locked_documents_created_at_idx" ON "payload_locked_documents" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_order_idx" ON "payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX "payload_locked_documents_rels_parent_idx" ON "payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX "payload_locked_documents_rels_path_idx" ON "payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX "payload_locked_documents_rels_users_id_idx" ON "payload_locked_documents_rels" USING btree ("users_id");
  CREATE INDEX "payload_locked_documents_rels_studios_id_idx" ON "payload_locked_documents_rels" USING btree ("studios_id");
  CREATE INDEX "payload_locked_documents_rels_bookings_id_idx" ON "payload_locked_documents_rels" USING btree ("bookings_id");
  CREATE INDEX "payload_locked_documents_rels_reviews_id_idx" ON "payload_locked_documents_rels" USING btree ("reviews_id");
  CREATE INDEX "payload_locked_documents_rels_posts_id_idx" ON "payload_locked_documents_rels" USING btree ("posts_id");
  CREATE INDEX "payload_locked_documents_rels_faqs_id_idx" ON "payload_locked_documents_rels" USING btree ("faqs_id");
  CREATE INDEX "payload_locked_documents_rels_stripe_events_id_idx" ON "payload_locked_documents_rels" USING btree ("stripe_events_id");
  CREATE INDEX "payload_preferences_key_idx" ON "payload_preferences" USING btree ("key");
  CREATE INDEX "payload_preferences_updated_at_idx" ON "payload_preferences" USING btree ("updated_at");
  CREATE INDEX "payload_preferences_created_at_idx" ON "payload_preferences" USING btree ("created_at");
  CREATE INDEX "payload_preferences_rels_order_idx" ON "payload_preferences_rels" USING btree ("order");
  CREATE INDEX "payload_preferences_rels_parent_idx" ON "payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX "payload_preferences_rels_path_idx" ON "payload_preferences_rels" USING btree ("path");
  CREATE INDEX "payload_preferences_rels_users_id_idx" ON "payload_preferences_rels" USING btree ("users_id");
  CREATE INDEX "payload_migrations_updated_at_idx" ON "payload_migrations" USING btree ("updated_at");
  CREATE INDEX "payload_migrations_created_at_idx" ON "payload_migrations" USING btree ("created_at");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "users_roles" CASCADE;
  DROP TABLE "users_sessions" CASCADE;
  DROP TABLE "users" CASCADE;
  DROP TABLE "studios_gallery" CASCADE;
  DROP TABLE "studios_included" CASCADE;
  DROP TABLE "studios_rules" CASCADE;
  DROP TABLE "studios" CASCADE;
  DROP TABLE "bookings" CASCADE;
  DROP TABLE "reviews" CASCADE;
  DROP TABLE "posts" CASCADE;
  DROP TABLE "posts_rels" CASCADE;
  DROP TABLE "faqs" CASCADE;
  DROP TABLE "stripe_events" CASCADE;
  DROP TABLE "payload_kv" CASCADE;
  DROP TABLE "payload_locked_documents" CASCADE;
  DROP TABLE "payload_locked_documents_rels" CASCADE;
  DROP TABLE "payload_preferences" CASCADE;
  DROP TABLE "payload_preferences_rels" CASCADE;
  DROP TABLE "payload_migrations" CASCADE;
  DROP TYPE "public"."enum_users_roles";
  DROP TYPE "public"."enum_studios_status";
  DROP TYPE "public"."enum_studios_category";
  DROP TYPE "public"."enum_studios_mode";
  DROP TYPE "public"."enum_studios_tier";
  DROP TYPE "public"."enum_bookings_status";
  DROP TYPE "public"."enum_reviews_status";`)
}
