-- Custom SQL: Drizzle cannot generate a grant (data D5). A Ontologia da empresa, U1, with the
-- founder's word in the pull request of its own (data D11; P1, 2026-11-12, in the card of the step):
-- a company's routes read and write the inventory, the proofs, the proposals and their
-- items, the revisions and the versions of the concepts, fields, codes, relations and sources, and
-- read the five views of what is current. A revision, a proof and a version are never changed or
-- deleted; of a proposal only its state changes, and of an item only its decision, its reason, who
-- decided and when. The inventory is replaced by run, so its three tables also delete. Everything
-- else leaves by the cascade from the company.
GRANT USAGE ON SCHEMA ontology TO hub_company;
--> statement-breakpoint
GRANT SELECT, INSERT ON TABLE ontology.inventory_run, ontology.inventory_end, ontology.inventory_entry, ontology.proof_run, ontology.proposal, ontology.proposal_item, ontology.revision, ontology.concept_version, ontology.field_version, ontology.code_version, ontology.relation_version, ontology.source_version TO hub_company;
--> statement-breakpoint
GRANT SELECT ON TABLE ontology.concept, ontology.field, ontology.code, ontology.relation, ontology.source TO hub_company;
--> statement-breakpoint
GRANT UPDATE (state) ON TABLE ontology.proposal TO hub_company;
--> statement-breakpoint
GRANT UPDATE (decision, reason, decided_by, decided_at) ON TABLE ontology.proposal_item TO hub_company;
--> statement-breakpoint
GRANT DELETE ON TABLE ontology.inventory_run, ontology.inventory_end, ontology.inventory_entry TO hub_company;
