import { CAPACITY } from '@conexus/hub-api'
import type { OrganizationOptions } from 'better-auth/plugins/organization'
import type { RoleSet } from './roles.ts'
import { NO_KIT_ROLES } from './roles.ts'

// The founder's number, step 4 answer 4.
const INVITATION_SECONDS = 2 * 24 * 60 * 60

const KEY_FIELD = { type: 'string', required: true } as const
// Left out of the plugin's request body (db/to-zod.mjs:17), so only the Hub's mark sets it.
const MAILED_FIELD = { type: 'date', required: false, input: false } as const
const APP_FIELD = { type: 'string', required: false, input: false } as const
// The mark of a company the Central is deleting: only the Hub sets it, never a request.
const DELETING_FIELD = { type: 'date', required: false, input: false } as const
// The company's nickname in its apps' addresses: only the owner's choice through the Hub sets it.
const NICKNAME_FIELD = { type: 'string', required: false, input: false } as const

// The name a person reads for a role of the company; the stored name is derived from it.
const LABEL_FIELD = { type: 'string', required: true } as const
// The attempt that created a role: the two seeded roles have none.
const ROLE_KEY_FIELD = { type: 'string', required: false } as const

/** The plugin's options with the roles of the kit the server starts with. */
export function organizationWith(set: RoleSet) {
  return {
    ac: set.ac,
    roles: set.roles,
    dynamicAccessControl: { enabled: true },
    schema: {
      organizationRole: { additionalFields: { label: LABEL_FIELD, attemptKey: ROLE_KEY_FIELD } },
      organization: {
        modelName: 'company',
        additionalFields: {
          attemptKey: KEY_FIELD,
          deletingSince: DELETING_FIELD,
          nickname: NICKNAME_FIELD,
        },
      },
      invitation: {
        additionalFields: {
          attemptKey: KEY_FIELD,
          mailedAt: MAILED_FIELD,
          projectId: APP_FIELD,
          appRole: APP_FIELD,
        },
      },
    },
    // Only the Operations Central creates a company, through the adapter (step 4.2).
    allowUserToCreateOrganization: false,
    // Only the Operations Central deletes a company, through the adapter (step 5, Q6).
    disableOrganizationDeletion: true,
    // The Hub counts the open invitations itself, under the company's lock: the plugin reads
    // at most 100 rows of them, in no order (docs/reference/boundaries.md).
    invitationLimit: Number.POSITIVE_INFINITY,
    invitationExpiresIn: INVITATION_SECONDS,
    membershipLimit: CAPACITY.members,
  } satisfies OrganizationOptions
}

/** The options the plugin's adapter reads; they name no connector, which only the roles do. */
export const ORGANIZATION = organizationWith(NO_KIT_ROLES)
