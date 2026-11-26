-- Custom SQL: Drizzle cannot generate a grant (data D5). The two lists of the domains a machine
-- may reach (data D11; founder, 2026-11-25, the card's decision B: "B.a"): the company's routes and
-- a conversation's tool keep the company's list; the tool and the conversation's deletion keep the
-- conversation's. The apps' role reaches neither table.
GRANT SELECT, INSERT, DELETE ON TABLE builder.company_network_domain, builder.conversation_network_domain TO hub_company;
