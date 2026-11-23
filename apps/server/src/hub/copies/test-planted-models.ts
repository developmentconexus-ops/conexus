export const MODELS = {
  clientes: {
    label: 'Clientes',
    definition: {
      version: 1,
      description:
        'Parceiros do Sankhya: clientes e fornecedores, um por linha, com nome, tipo de pessoa e se está ativo.',
      source: {
        kind: 'QUERY',
        sql: 'SELECT CODPARC, NOMEPARC, RAZAOSOCIAL, CGC_CPF, TIPPESSOA, ATIVO, CLIENTE, FORNECEDOR, DTALTER FROM TGFPAR',
      },
      columns: [
        { name: 'CODPARC', type: 'bigint', description: 'Código do parceiro no Sankhya.' },
        { name: 'NOMEPARC', type: 'text', description: 'Nome do parceiro.' },
        { name: 'RAZAOSOCIAL', type: 'text', description: 'Razão social do parceiro.' },
        { name: 'CGC_CPF', type: 'text', description: 'CPF ou CNPJ do parceiro.' },
        { name: 'TIPPESSOA', type: 'text', description: 'Tipo de pessoa: F física, J jurídica.' },
        {
          name: 'ATIVO',
          type: 'text',
          description: 'S quando o cadastro está ativo, N quando não.',
        },
        { name: 'CLIENTE', type: 'text', description: 'S quando o parceiro é cliente.' },
        { name: 'FORNECEDOR', type: 'text', description: 'S quando o parceiro é fornecedor.' },
        {
          name: 'DTALTER',
          type: 'timestamp',
          description: 'Data e hora da última alteração do registro no Sankhya.',
        },
      ],
      key: ['CODPARC'],
      changedSince: { column: 'DTALTER' },
    },
  },
  vendedores: {
    label: 'Vendedores',
    definition: {
      version: 1,
      description: 'Vendedores do Sankhya, um por linha, com o apelido e se está ativo.',
      source: { kind: 'QUERY', sql: 'SELECT CODVEND, APELIDO, ATIVO, DTALTER FROM TGFVEN' },
      columns: [
        { name: 'CODVEND', type: 'bigint', description: 'Código do vendedor no Sankhya.' },
        { name: 'APELIDO', type: 'text', description: 'Apelido do vendedor.' },
        {
          name: 'ATIVO',
          type: 'text',
          description: 'S quando o cadastro está ativo, N quando não.',
        },
        {
          name: 'DTALTER',
          type: 'timestamp',
          description: 'Data e hora da última alteração do registro no Sankhya.',
        },
      ],
      key: ['CODVEND'],
      changedSince: { column: 'DTALTER' },
    },
  },
  produtos: {
    label: 'Produtos',
    definition: {
      version: 1,
      description:
        'Produtos do Sankhya, um por linha, com descrição, referência, grupo, unidade e marca.',
      source: {
        kind: 'QUERY',
        sql: 'SELECT P.CODPROD, P.DESCRPROD, P.REFERENCIA, P.CODGRUPOPROD, G.DESCRGRUPOPROD, P.CODVOL, P.MARCA, P.ATIVO, P.DTALTER FROM TGFPRO P LEFT JOIN TGFGRU G ON G.CODGRUPOPROD = P.CODGRUPOPROD',
      },
      columns: [
        { name: 'CODPROD', type: 'bigint', description: 'Código do produto no Sankhya.' },
        { name: 'DESCRPROD', type: 'text', description: 'Descrição do produto.' },
        { name: 'REFERENCIA', type: 'text', description: 'Referência do produto.' },
        { name: 'CODGRUPOPROD', type: 'bigint', description: 'Código do grupo do produto.' },
        { name: 'DESCRGRUPOPROD', type: 'text', description: 'Nome do grupo do produto.' },
        { name: 'CODVOL', type: 'text', description: 'Unidade de venda.' },
        { name: 'MARCA', type: 'text', description: 'Marca do produto.' },
        {
          name: 'ATIVO',
          type: 'text',
          description: 'S quando o cadastro está ativo, N quando não.',
        },
        {
          name: 'DTALTER',
          type: 'timestamp',
          description: 'Data e hora da última alteração do registro no Sankhya.',
        },
      ],
      key: ['CODPROD'],
      changedSince: { column: 'DTALTER' },
    },
  },
  vendas: {
    label: 'Vendas',
    definition: {
      version: 1,
      description:
        'Cabeçalho de cada venda e pedido de venda do Sankhya: data, cliente, vendedor, valor e situação. Uma linha por nota.',
      source: {
        kind: 'QUERY',
        sql: "SELECT NUNOTA, NUMNOTA, CODEMP, CODTIPOPER, TIPMOV, DTNEG, CODPARC, CODVEND, VLRNOTA, STATUSNOTA, DTALTER FROM TGFCAB WHERE TIPMOV IN ('V', 'P')",
      },
      columns: [
        {
          name: 'NUNOTA',
          type: 'bigint',
          description: 'Número único da nota no Sankhya. É a chave da venda.',
        },
        { name: 'NUMNOTA', type: 'bigint', description: 'Número da nota fiscal.' },
        { name: 'CODEMP', type: 'bigint', description: 'Código da empresa (filial) da venda.' },
        { name: 'CODTIPOPER', type: 'bigint', description: 'Código do tipo de operação (TOP).' },
        {
          name: 'TIPMOV',
          type: 'text',
          description: 'Tipo de movimento: V venda, P pedido de venda.',
        },
        { name: 'DTNEG', type: 'date', description: 'Data da negociação.' },
        { name: 'CODPARC', type: 'bigint', description: 'Código do parceiro no Sankhya.' },
        { name: 'CODVEND', type: 'bigint', description: 'Código do vendedor no Sankhya.' },
        { name: 'VLRNOTA', type: 'numeric', description: 'Valor total da nota.' },
        { name: 'STATUSNOTA', type: 'text', description: 'Situação da nota no Sankhya.' },
        {
          name: 'DTALTER',
          type: 'timestamp',
          description: 'Data e hora da última alteração do registro no Sankhya.',
        },
      ],
      key: ['NUNOTA'],
      changedSince: { column: 'DTALTER' },
      window: { column: 'DTNEG', days: 30 },
    },
  },
  itens_venda: {
    label: 'Itens de venda',
    definition: {
      version: 1,
      description:
        'Itens de cada venda e pedido de venda do Sankhya: produto, quantidade, valor unitário e total. Uma linha por item.',
      source: {
        kind: 'QUERY',
        sql: "SELECT I.NUNOTA, I.SEQUENCIA, I.CODPROD, I.QTDNEG, I.VLRUNIT, I.VLRTOT, I.CODVOL, C.DTNEG, C.DTALTER FROM TGFITE I JOIN TGFCAB C ON C.NUNOTA = I.NUNOTA WHERE C.TIPMOV IN ('V', 'P')",
      },
      columns: [
        {
          name: 'NUNOTA',
          type: 'bigint',
          description: 'Número único da nota no Sankhya. É a chave da venda.',
        },
        { name: 'SEQUENCIA', type: 'bigint', description: 'Sequência do item dentro da nota.' },
        { name: 'CODPROD', type: 'bigint', description: 'Código do produto no Sankhya.' },
        { name: 'QTDNEG', type: 'numeric', description: 'Quantidade negociada do item.' },
        { name: 'VLRUNIT', type: 'numeric', description: 'Valor unitário do item.' },
        { name: 'VLRTOT', type: 'numeric', description: 'Valor total do item.' },
        { name: 'CODVOL', type: 'text', description: 'Unidade de venda.' },
        { name: 'DTNEG', type: 'date', description: 'Data da negociação.' },
        {
          name: 'DTALTER',
          type: 'timestamp',
          description: 'Data e hora da última alteração do registro no Sankhya.',
        },
      ],
      key: ['NUNOTA', 'SEQUENCIA'],
      changedSince: { column: 'DTALTER' },
      window: { column: 'DTNEG', days: 30 },
    },
  },
}
