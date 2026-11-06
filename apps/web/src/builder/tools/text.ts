import type { ToolEffect } from '@conexus/hub-api'

export const NO_TOOLS_YET =
  'Nenhuma ferramenta ainda. O Construtor faz as primeiras quando monta um agente.'
export const NOBODY_USES = 'ninguém'

/** The effect of a tool in the list's Efeito column. */
export const EFFECT_TEXT: Record<ToolEffect, string> = { READ: 'Lê' }
export const UNCONFIRMED_DELETE =
  'Não foi possível confirmar se a ferramenta foi apagada. Confira a lista.'
export const UNCONFIRMED_VERSION =
  'Não foi possível confirmar se a versão foi gravada. Confira as versões.'
export const BACK_TO_TOOLS = 'Voltar às ferramentas'

/** The mark of a tool the Construtor wrote in code. */
export const IN_CODE = 'Em código'

/** What the test of a version in code proved: that it passed, on how many real rows. */
export function testText(test: { rows: number }): string {
  return `Teste passou · ${test.rows} ${test.rows === 1 ? 'linha lida' : 'linhas lidas'}`
}

export function deleteWarning(slug: string): string {
  return `Apagar ${slug} tira a ferramenta e todas as versões dela da biblioteca. Não dá para desfazer.`
}
