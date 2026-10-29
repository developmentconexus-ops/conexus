# Build the Builder's machine template

The template the Builder's E2B machines start from ([0051](../decisions/0051-builder-machine-git-and-copy-in-r2.md),
[0055](../decisions/0055-apps-on-the-platform-contract.md)). It carries the SDK the Hub's image
expects, so a Release builds both from one commit.

## Every Release

The workflow Publish builds the template from the Release's commit with `node infra/e2b/template.ts`.
The account's key comes from the repository secret `E2B_API_KEY`, only into that step. The build
starts a machine from the new template and checks that every SDK file the commit holds is there,
byte for byte, then prints `HUB_E2B_TEMPLATE=conexus-builder:<commit>`. The deploy starts the Hub
with that template beside the image and records both for Voltar atrás. A failed build or check
fails the Release before the deploy, and the Hub keeps its image and template.

Every Release builds, even when the SDK did not change: the template also depends on
`infra/e2b/template.ts`, the edge's `wrangler` and the Node image, and E2B reuses the cached layers
of an unchanged build.

## Try a candidate

A build is a paid call; firstmate runs it.

1. Check out the commit to try; the build copies `packages/app` and `packages/app-contract` from it.
2. Run `E2B_API_KEY=… node infra/e2b/template.ts`.
3. Read the last line: `HUB_E2B_TEMPLATE=conexus-builder:<commit>`.
4. Actions, Reiniciar o Hub, Run workflow, with `conexus-builder:<commit>` as the template.

The build is tagged with the commit, so it never replaces a template the Hub runs. To go back, run
Reiniciar o Hub with the earlier template, or Voltar atrás to the release; a release recorded
before templates keeps the live one. The template is never
in `hub.env` or fixed in `infra/compose.yaml`: `deploy.sh` passes it beside the image.
