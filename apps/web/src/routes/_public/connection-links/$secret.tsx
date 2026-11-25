import { createFileRoute } from '@tanstack/react-router'
import { connectionLinkQuery, LinkGone, LinkPage } from '../../../hub/connectors/public.ts'
import { readOrNotFound } from '../../../platform/hub.ts'

export const Route = createFileRoute('/_public/connection-links/$secret')({
  loader: ({ context, params }) =>
    readOrNotFound(context.queryClient.fetchQuery(connectionLinkQuery(params.secret))),
  component: LinkPage,
  notFoundComponent: LinkGone,
})
