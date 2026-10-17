import type { FailureCode } from '@conexus/hub-api'
import { COMPANY_NAME_MAX_LENGTH, LEGAL_NAME_MAX_LENGTH } from '@conexus/hub-api'
import { HubFailure } from '../../platform/hub.ts'
import { TextField } from '../../ui/form.tsx'

/** The refusals that belong on a field of the registration or the correction (web W23). */
const FIELD_OF: Partial<Record<FailureCode, 'cnpj' | 'ownerEmail'>> = {
  CLIENT_EXISTS: 'cnpj',
  CLIENT_OWNER_IS_OPERATOR: 'ownerEmail',
  MAIL_BOUNCED: 'ownerEmail',
}

export function fieldOf(error: unknown) {
  return error instanceof HubFailure ? FIELD_OF[error.code] : undefined
}

/** Whether the Hub may have saved: the answer was cut, or did not settle the write (code C37). */
export function undecided(error: unknown): boolean {
  return !(error instanceof HubFailure) || error.outcomeUnknown
}

/** The company's data, the same in the registration and the correction. */
export function ClientFields() {
  return (
    <>
      <TextField
        name="cnpj"
        label="CNPJ"
        type="text"
        autoComplete="off"
        invalid="Confira o CNPJ: 14 posições, com os dois dígitos verificadores."
      />
      <TextField
        name="legalName"
        label="Razão social"
        type="text"
        autoComplete="off"
        invalid={`Escreva a razão social, com até ${LEGAL_NAME_MAX_LENGTH} caracteres.`}
      />
      <TextField
        name="name"
        label="Nome de exibição"
        type="text"
        autoComplete="off"
        invalid={`Escreva o nome de exibição, com até ${COMPANY_NAME_MAX_LENGTH} caracteres.`}
      />
    </>
  )
}
