CREATE SCHEMA "operations";
--> statement-breakpoint
CREATE TABLE "operations"."client" (
	"company_id" text PRIMARY KEY,
	"cnpj" text NOT NULL CONSTRAINT "client_cnpj_key" UNIQUE,
	"legal_name" text NOT NULL,
	"revision" integer DEFAULT 0 NOT NULL,
	"attempt_key" text NOT NULL CONSTRAINT "client_attempt_key_key" UNIQUE,
	"registered_at" timestamp with time zone NOT NULL,
	CONSTRAINT "client_cnpj_format" CHECK ("cnpj" ~ '^[0-9A-Z]{12}[0-9]{2}$'),
	CONSTRAINT "client_legal_name_length" CHECK (char_length("legal_name") BETWEEN 1 AND 150),
	CONSTRAINT "client_revision_not_negative" CHECK ("revision" >= 0)
);
