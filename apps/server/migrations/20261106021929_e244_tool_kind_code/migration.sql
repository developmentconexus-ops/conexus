-- contract: a trava passa a aceitar CODE
ALTER TABLE "builder"."tool" DROP CONSTRAINT "tool_kind", ADD CONSTRAINT "tool_kind" CHECK ("kind" in ('PRESET', 'CODE'));
