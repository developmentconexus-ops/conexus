# Set up the saved tools' host

What firstmate does once with the founder's approval so the Hub can call step 24.4's saved tools.
They run in their own namespace, behind Cloudflare Access, at `tools.<apps domain>`; the edge
itself comes first: [apps-edge](apps-edge.md).

1. The namespace: `wrangler dispatch-namespace create conexus-tools`. `apps/edge/wrangler.jsonc`
   binds it as `TOOLS`, with the same wall as `conexus-apps`.
2. In Zero Trust, a self-hosted Access application on `tools.<apps domain>` whose one policy is
   Service Auth for the service token `conexus-hub-tools`. The token lasts one year: renew it before
   it expires, and write both halves again in step 4.
3. The application's audience (AUD, not a secret) goes in `TOOLS_ACCESS_AUD` in
   `apps/edge/wrangler.jsonc`, and is committed. The dispatcher refuses with 403 a request on that
   host whose Access context is missing or has another audience.
4. On the server, as root, write the token's two halves to
   `/etc/conexus/secrets/hub_tools_access_client_id` and
   `/etc/conexus/secrets/hub_tools_access_client_secret`, each owner uid 1000, mode 0400, beside the
   other keys ([hub-server](hub-server.md)).
   `infra/deploy.sh` refuses to deploy without them. The Hub uploads the tools with the apps' token,
   whose Workers Scripts permission covers both namespaces.
