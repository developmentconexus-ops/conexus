# Contatos

`contatos`: a page of contacts, each with its `properties`: `email`, `firstname`, `lastname`, `phone`, `createdate` and `lastmodifieddate`. A property HubSpot has no value for comes as `null` or is missing. The e-mail and the phone are personal data.

`notaNoContato`: creates a note on one contact. Input: `contactId`, the `id` of a record of `contatos`, and `body`, the text (up to 65,536 characters, the Conexus mark of 17 included). It waits for the person's approval, then HubSpot dates the note at the moment it is sent. Answer: `{ id }`, the note's id. A refusal means no note was created; an answer the Conexus could not read means it may exist, so look for it before asking again.
