# The Sync: where the company's copies live

Copies go, table by table, to each company's lake on AWS
([0070](../decisions/0070-copied-company-data-lives-in-a-lake-on-aws.md)) as Singer taps
([0071](../decisions/0071-connectors-kit-live-copies-singer.md)). Nothing in the Hub creates, runs,
reads or releases a copy in the company's database: the engine left with the first group of the
lake's part 0, what read a copy left with the second, and the Hub's tables of the schema `copies`
and the copies' notifications left with the third (G0c, data D6). On 2026-11-24 the readjust took
the schema `sync` and its logins out of the company's database
([Data track](../steps/trilhas/dados.md)).

`agents/app-builder/git/copy` has nothing to do with this: it is the Git bundle copied to R2
([0051](../decisions/0051-builder-machine-git-and-copy-in-r2.md)).
