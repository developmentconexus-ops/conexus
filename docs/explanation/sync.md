# The Sync: what is left of the company's copies

Copies are moving, table by table, to each company's lake on AWS
([0070](../decisions/0070-copied-company-data-lives-in-a-lake-on-aws.md)) as Singer taps
([0071](../decisions/0071-connectors-kit-live-copies-singer.md)). Nothing in the Hub creates, runs,
reads or releases a copy in the company's database any more: the engine left with the first group
of the lake's part 0, what read a copy left with the second, and the Hub's tables of the schema
`copies` and the copies' notifications left with the third (G0c, data D6)
([Data track](../steps/trilhas/dados.md)).

What remains:

- In each company's database, the schema `sync` and its logins, until the readjust takes them out.
  No Hub code opens a company's database with them.
- The kit's `CopyDefinition` (`packages/connectors/src/kernel/copy.ts`), the shape of a stored
  definition.

`builder/git/copy` has nothing to do with this: it is the Git bundle copied to R2
([0051](../decisions/0051-builder-machine-git-and-copy-in-r2.md)).
