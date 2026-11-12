-- contract: copy_connection_fkey leaves, the constraint and not a column: no query depends on it, only
-- its cascade, which decision C replaces (O Sync de qualquer conector): a copy ends with its last
-- source in copies.copy_source, not with the first connection it was turned on from, which data D17
-- says a convenient key must not force. connection_id stays, unread, and leaves later (data D6).
ALTER TABLE "copies"."copy" DROP CONSTRAINT "copy_connection_fkey";
