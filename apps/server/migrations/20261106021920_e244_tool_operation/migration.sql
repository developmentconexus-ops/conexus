-- contract: a ferramenta CODE lê várias operações, guardadas na versão
ALTER TABLE "builder"."tool" ALTER COLUMN "operation" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "builder"."tool" ADD CONSTRAINT "tool_operation_by_kind" CHECK (("kind" = 'PRESET') = ("operation" is not null));