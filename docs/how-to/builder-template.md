# Build the Builder's machine template

The template the Builder's E2B machines start from ([0051](../decisions/0051-builder-machine-git-and-copy-in-r2.md),
[0055](../decisions/0055-apps-on-the-platform-contract.md)). A build is a paid call; firstmate runs it.

## Build a candidate

1. Check out the commit to ship; the build copies `packages/app` and `packages/app-contract` from it.
2. Run `E2B_API_KEY=… node infra/e2b/template.ts`.
3. Read the last line: `HUB_E2B_TEMPLATE=conexus-builder:<commit>`.

The build is tagged with the commit, so it never replaces a template the Hub runs.

## Put it into use, or go back

Write the printed line in `/etc/conexus/hub.env` and restart the Hub, once the candidate is proved.
To go back, write the line of the earlier build; its tag is still in E2B. `HUB_E2B_TEMPLATE` in
`infra/compose.yaml` must not hold a fixed value, or it wins over `hub.env`.
