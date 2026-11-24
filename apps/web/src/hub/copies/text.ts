/** The words of the Dados screens (Capacidade 2, U4); the founder approves them at the step's end. */
export const DATA_TITLE = 'Dados'
export const DATA_INTRO =
  'O que os agentes e os apps da empresa podem ler: cada tabela, de qual sistema veio, o que guarda e de quando é.'
export const NO_SYSTEM = 'Nenhum sistema ligado ainda'
export const NO_SYSTEM_HINT =
  'Ligue um sistema da empresa, como o Sankhya, e as tabelas copiadas dele aparecem aqui.'
export const LINK_SYSTEM = 'Ligar um sistema'
export const NO_TABLE_COPIED = 'Nenhuma tabela copiada'
export const NO_TABLE_OF_ROLE =
  'Seu papel ainda não lê nenhuma tabela. Peça a quem administra a empresa.'
export const NO_TABLE_OF_ROLE_SHORT = 'Seu papel ainda não lê nenhuma tabela.'
export const NO_CONCEPT = 'Nenhum conceito aprovado ainda'
export const CONCEPT_HINT =
  'Um conceito é o significado de uma palavra do negócio, aprovado por uma pessoa da empresa, como "Venda". Quando o primeiro for aprovado, ele aparece aqui.'
export const CATALOG_FAILED =
  'Não deu para ler o catálogo agora. Nada foi apagado. Tente de novo em instantes.'
export const TREE_LABEL = 'Dados'
export const LOADING_LABEL = 'Carregando'
export const DATA_LAYERS = { raw: 'Bruto', business: 'Negócio', apps: 'Apps' } as const

/** A system's header in the list: its name, the connections' names (not one that repeats the system's) and how many tables it has. */
export function systemText(system: string, accounts: readonly string[], tables: number): string {
  const counted = tables === 0 ? [] : [`${tables} ${tables === 1 ? 'tabela' : 'tabelas'}`]
  const named = accounts.filter((account) => account !== system)
  return [system, named.join(', '), ...counted].filter((part) => part !== '').join(' · ')
}
export const APPS_INTRO =
  'As tabelas que cada app guarda. Elas são do Projeto e ficam aqui só para leitura.'
export const OPEN_PROJECT = 'Abrir o Projeto'
export const APPS_EMPTY = 'Nenhum app guarda tabelas ainda.'
export const MORE_PROJECTS = 'Mais Projetos'
export const APPS_COLUMNS = ['Tabela', 'Versão', 'Linhas'] as const

/** The version an app's tables belong to: the published one, or the one still being built. */
export function versionText(version: {
  publishedVersion: number | null
  appVersion: number
}): string {
  return version.publishedVersion !== null
    ? `Publicado · v${version.publishedVersion}`
    : `Em construção · v${version.appVersion}`
}
