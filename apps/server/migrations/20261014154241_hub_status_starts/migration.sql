CREATE SCHEMA "hub";
--> statement-breakpoint
CREATE TABLE "hub"."starts" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "hub"."starts_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"version" text NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "starts_version_format" CHECK ("version" ~ '^v[0-9]+\.[0-9]+\.[0-9]+$')
);
